const express = require("express");
const { DeploymentPlatform, DeploymentMusic, Deployment, Bot, User } = require("../models");
const { protect, adminOnly } = require("../middleware/auth");
const heroku = require("../utils/heroku");
const { emitLiveEvent } = require("../utils/liveEvents");

const router = express.Router();

/* ---------------- Public ---------------- */
router.get("/platforms", async (req, res) => {
  res.json(await DeploymentPlatform.find({ isHidden: false }).sort({ order: 1 }));
});
router.get("/music", async (req, res) => {
  res.json(await DeploymentMusic.find({ isHidden: false }).sort({ order: 1 }));
});

/* Generates a valid app name per platform naming rules, e.g. "adevos-x-ahmed-128h6" */
function generateAppName(botSlug, ownerName, rules) {
  const clean = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "");
  const random = Math.random().toString(36).slice(2, 7);
  let name = `${clean(botSlug)}-${clean(ownerName)}-${random}`;
  if (rules?.maxLength) name = name.slice(0, rules.maxLength);
  // Heroku requires the name to START with a lowercase letter
  if (!/^[a-z]/.test(name)) name = `bot-${name}`.slice(0, rules?.maxLength || 30);
  return name;
}

/* Runs the real Heroku build in the background and streams logs to the
   deployment's socket room + updates the Deployment document as it progresses. */
async function runHerokuDeployment(io, deployment, bot) {
  const room = `deployment:${deployment._id}`;
  const pushLog = async (line) => {
    deployment.buildLogs.push(line);
    await deployment.save();
    io.to(room).emit("build-log", line);
  };

  try {
    if (!heroku.isConfigured()) {
      await pushLog("HEROKU_API_KEY not set — cannot deploy automatically yet. An admin can deploy this manually and update the status.");
      return;
    }
    if (!bot.githubRepoUrl && !bot.isFree) {
      await pushLog("This bot has no GitHub repo configured — nothing to build.");
      deployment.status = "failed";
      await deployment.save();
      io.to(room).emit("build-status", "failed");
      return;
    }

    await pushLog(`Creating Heroku app "${deployment.appName}"...`);
    await heroku.createApp(deployment.appName);

    await pushLog("Setting environment variables (session ID only)...");
    await heroku.setConfigVars(deployment.appName, { SESSION_ID: deployment.sessionId });

    // GitHub codeload tarball URL for the bot's default branch — swap to a
    // specific branch/tag per bot if your repos use something other than "main".
    const repoPath = bot.githubRepoUrl.replace("https://github.com/", "").replace(/\.git$/, "");
    const tarballUrl = `https://github.com/${repoPath}/tarball/main`;

    await pushLog("Starting build from source...");
    deployment.status = "building";
    await deployment.save();
    io.to(room).emit("build-status", "building");

    const build = await heroku.createBuild(deployment.appName, tarballUrl);
    deployment.platformResourceId = build.app.id;
    await deployment.save();

    // Poll build status (Heroku doesn't push webhooks for this by default)
    let status = build.status;
    let attempts = 0;
    while (status === "pending" && attempts < 60) {
      await new Promise((r) => setTimeout(r, 5000));
      const latest = await heroku.getBuild(deployment.appName, build.id);
      status = latest.status;
      attempts += 1;
    }

    if (status === "succeeded") {
      await pushLog("Build succeeded! Your bot is now live.");
      deployment.status = "active";
      await deployment.save();
      io.to(room).emit("build-status", "active");
    } else {
      await pushLog(`Build ${status}.`);
      deployment.status = "failed";
      await deployment.save();
      io.to(room).emit("build-status", "failed");
    }
  } catch (err) {
    await pushLog(`Error: ${err.response?.data?.message || err.message}`);
    deployment.status = "failed";
    await deployment.save();
    io.to(room).emit("build-status", "failed");
  }
}

/* ---------------- Authenticated ---------------- */
router.post("/", protect, async (req, res) => {
  try {
    const { botId, platformId, ownerName, ownerNumber, sessionId, durationWeeks } = req.body;

    const bot = await Bot.findById(botId);
    const platform = await DeploymentPlatform.findById(platformId);
    if (!bot || !platform) return res.status(400).json({ message: "Invalid bot or platform" });

    if (req.user.plan === "user") {
      const existingActive = await Deployment.findOne({
        user: req.user._id,
        status: { $in: ["queued", "building", "active"] },
      });
      if (existingActive) {
        return res.status(409).json({
          message: "User plan allows only one active bot. Delete or upgrade to Deployer plan first.",
        });
      }
    }

    const appName = generateAppName(bot.slug, ownerName, platform.appNameRules);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(durationWeeks || 0) * 7);

    const deployment = await Deployment.create({
      user: req.user._id,
      bot: bot._id,
      plan: req.user.plan,
      platform: platform._id,
      appName,
      ownerName,
      ownerNumber,
      sessionId,
      packageDurationWeeks: durationWeeks,
      expiresAt,
      status: "queued",
      buildLogs: ["Deployment queued..."],
    });

    res.status(201).json(deployment);

    // Kick off the real deploy in the background (only wired for Heroku right now —
    // extend runHerokuDeployment's pattern for Railway/Render using their own APIs
    // when RAILWAY_API_TOKEN / RENDER_API_KEY are set).
    const io = req.app.get("io");
    if (platform.apiIdentifier === "heroku") {
      runHerokuDeployment(io, deployment, bot);
    } else {
      deployment.buildLogs.push(`Automated deployment for ${platform.name} is not wired up yet — an admin can deploy this manually.`);
      await deployment.save();
    }
    emitLiveEvent(req.app, `${req.user.name} started deploying ${bot.name} on ${platform.name}`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/mine", protect, async (req, res) => {
  res.json(
    await Deployment.find({ user: req.user._id })
      .populate("bot", "name imageUrl")
      .populate("platform", "name icon")
      .sort({ createdAt: -1 })
  );
});

router.get("/:id", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id })
    .populate("bot")
    .populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });
  res.json(deployment);
});

router.post("/:id/restart", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id });
  if (!deployment) return res.status(404).json({ message: "Not found" });
  deployment.status = "building";
  deployment.buildLogs.push("Restart requested...");
  await deployment.save();

  if (heroku.isConfigured()) {
    try {
      await heroku.restartApp(deployment.appName);
      deployment.status = "active";
      deployment.buildLogs.push("Dynos restarted successfully.");
    } catch (err) {
      deployment.buildLogs.push(`Restart failed: ${err.response?.data?.message || err.message}`);
      deployment.status = "failed";
    }
    await deployment.save();
  }
  res.json(deployment);
});

router.post("/:id/stop", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id });
  if (!deployment) return res.status(404).json({ message: "Not found" });

  if (heroku.isConfigured()) {
    try { await heroku.scaleDown(deployment.appName); } catch (err) { /* app may already be gone */ }
  }
  deployment.status = "stopped";
  await deployment.save();
  res.json(deployment);
});

router.delete("/:id", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id });
  if (!deployment) return res.status(404).json({ message: "Not found" });

  if (heroku.isConfigured()) {
    try { await heroku.deleteApp(deployment.appName); } catch (err) { /* app may already be gone */ }
  }
  deployment.status = "deleted";
  await deployment.save();
  res.json({ message: "Deployment deleted" });
});

/* ---------------- Admin ---------------- */
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  res.json(
    await Deployment.find()
      .populate("user", "name email")
      .populate("bot", "name")
      .populate("platform", "name")
      .sort({ createdAt: -1 })
  );
});

router.get("/admin/stats", protect, adminOnly, async (req, res) => {
  const byPlatform = await Deployment.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$platform", count: { $sum: 1 } } },
  ]);
  res.json({ byPlatform });
});

router.delete("/admin/:id", protect, adminOnly, async (req, res) => {
  const deployment = await Deployment.findById(req.params.id);
  if (!deployment) return res.status(404).json({ message: "Not found" });
  if (heroku.isConfigured()) {
    try { await heroku.deleteApp(deployment.appName); } catch (err) { /* ignore */ }
  }
  deployment.status = "deleted";
  await deployment.save();
  res.json({ message: "Deleted by admin" });
});

module.exports = router;
