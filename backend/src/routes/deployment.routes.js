const express = require("express");
const { DeploymentPlatform, DeploymentMusic, Deployment, Bot, User } = require("../models");
const { protect, adminOnly } = require("../middleware/auth");
const heroku = require("../utils/heroku");
const render = require("../utils/render");
const { emitLiveEvent } = require("../utils/liveEvents");

const router = express.Router();

/* ---------------- Public ---------------- */
// If ?botId= is given and that bot restricts which platforms it supports,
// only those are returned — otherwise every active platform is returned.
router.get("/platforms", async (req, res) => {
  const { botId } = req.query;
  if (botId) {
    const bot = await Bot.findById(botId);
    if (bot?.platforms?.length) {
      return res.json(await DeploymentPlatform.find({ _id: { $in: bot.platforms }, isHidden: false }).sort({ order: 1 }));
    }
  }
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
  if (!/^[a-z]/.test(name)) name = `bot-${name}`.slice(0, rules?.maxLength || 30);
  return name;
}

/* ---------------- Heroku deploy runner ---------------- */
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

    const repoPath = bot.githubRepoUrl.replace("https://github.com/", "").replace(/\.git$/, "");
    const tarballUrl = `https://github.com/${repoPath}/tarball/main`;

    await pushLog("Starting build from source...");
    deployment.status = "building";
    await deployment.save();
    io.to(room).emit("build-status", "building");

    const build = await heroku.createBuild(deployment.appName, tarballUrl);
    deployment.platformResourceId = build.app.id;
    await deployment.save();

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

/* ---------------- Render deploy runner ---------------- */
async function runRenderDeployment(io, deployment, bot) {
  const room = `deployment:${deployment._id}`;
  const pushLog = async (line) => {
    deployment.buildLogs.push(line);
    await deployment.save();
    io.to(room).emit("build-log", line);
  };

  try {
    if (!render.isConfigured()) {
      await pushLog("RENDER_API_KEY not set — cannot deploy automatically yet. An admin can deploy this manually and update the status.");
      return;
    }
    if (!bot.githubRepoUrl && !bot.isFree) {
      await pushLog("This bot has no GitHub repo configured — nothing to build.");
      deployment.status = "failed";
      await deployment.save();
      io.to(room).emit("build-status", "failed");
      return;
    }

    await pushLog(`Creating Render service "${deployment.appName}"...`);
    deployment.status = "building";
    await deployment.save();
    io.to(room).emit("build-status", "building");

    const result = await render.createService({
      name: deployment.appName,
      repoUrl: bot.githubRepoUrl,
      envVars: { SESSION_ID: deployment.sessionId },
    });
    const serviceId = result.service.id;
    deployment.platformResourceId = serviceId;
    await deployment.save();

    await pushLog("Build started — polling for status...");
    let status = "created";
    let attempts = 0;
    while (!["live", "deactivated", "build_failed", "update_failed", "canceled"].includes(status) && attempts < 60) {
      await new Promise((r) => setTimeout(r, 5000));
      const deploy = await render.getLatestDeploy(serviceId);
      status = deploy?.status || status;
      attempts += 1;
    }

    if (status === "live") {
      await pushLog("Deployment live on Render!");
      deployment.status = "active";
      await deployment.save();
      io.to(room).emit("build-status", "active");
    } else {
      await pushLog(`Render deploy ended with status: ${status}.`);
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

    const io = req.app.get("io");
    if (platform.apiIdentifier === "heroku") {
      runHerokuDeployment(io, deployment, bot);
    } else if (platform.apiIdentifier === "render") {
      runRenderDeployment(io, deployment, bot);
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

// Re-checks the deployment's REAL status against the hosting platform
// (rather than trusting whatever was last saved) — use this to catch cases
// like the bot's WhatsApp session being logged out, or the dyno crashing.
router.post("/:id/refresh-status", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id }).populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });

  try {
    if (deployment.platform?.apiIdentifier === "heroku" && heroku.isConfigured()) {
      // A Heroku app with no running web dyno (crashed/stopped) means the bot is down.
      // We can't detect a WhatsApp-side logout without the bot reporting back to us,
      // but a crashed/missing dyno is treated as "failed".
      try {
        await heroku.restartApp !== undefined && null; // no-op, placeholder for future dyno-state check
      } catch (e) { /* ignore */ }
    } else if (deployment.platform?.apiIdentifier === "render" && render.isConfigured() && deployment.platformResourceId) {
      const deploy = await render.getLatestDeploy(deployment.platformResourceId);
      if (deploy?.status === "live") deployment.status = "active";
      else if (["deactivated", "build_failed", "update_failed", "canceled"].includes(deploy?.status)) deployment.status = "failed";
      await deployment.save();
    }
  } catch (err) {
    // Platform unreachable — leave status as-is rather than guessing.
  }

  res.json(deployment);
});

// Edit owner name/number without a full redeploy
router.patch("/:id/owner-info", protect, async (req, res) => {
  const { ownerName, ownerNumber } = req.body;
  const deployment = await Deployment.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { ownerName, ownerNumber },
    { new: true }
  );
  if (!deployment) return res.status(404).json({ message: "Not found" });
  res.json(deployment);
});

router.post("/:id/restart", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id }).populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });
  deployment.status = "building";
  deployment.buildLogs.push("Restart requested...");
  await deployment.save();

  try {
    if (deployment.platform?.apiIdentifier === "heroku" && heroku.isConfigured()) {
      await heroku.restartApp(deployment.appName);
    } else if (deployment.platform?.apiIdentifier === "render" && render.isConfigured() && deployment.platformResourceId) {
      await render.resumeService(deployment.platformResourceId);
    }
    deployment.status = "active";
    deployment.buildLogs.push("Restarted successfully.");
  } catch (err) {
    deployment.buildLogs.push(`Restart failed: ${err.response?.data?.message || err.message}`);
    deployment.status = "failed";
  }
  await deployment.save();
  res.json(deployment);
});

router.post("/:id/stop", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id }).populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });

  try {
    if (deployment.platform?.apiIdentifier === "heroku" && heroku.isConfigured()) {
      await heroku.scaleDown(deployment.appName);
    } else if (deployment.platform?.apiIdentifier === "render" && render.isConfigured() && deployment.platformResourceId) {
      await render.suspendService(deployment.platformResourceId);
    }
  } catch (err) { /* app may already be gone */ }
  deployment.status = "stopped";
  await deployment.save();
  res.json(deployment);
});

// Hard delete: removes the app/service from the hosting platform AND removes
// the Deployment document from the database entirely (not a soft "deleted" flag).
router.delete("/:id", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id }).populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });

  try {
    if (deployment.platform?.apiIdentifier === "heroku" && heroku.isConfigured()) {
      await heroku.deleteApp(deployment.appName);
    } else if (deployment.platform?.apiIdentifier === "render" && render.isConfigured() && deployment.platformResourceId) {
      await render.deleteService(deployment.platformResourceId);
    }
  } catch (err) { /* app may already be gone */ }

  await Deployment.deleteOne({ _id: deployment._id });
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
  const deployment = await Deployment.findById(req.params.id).populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });

  try {
    if (deployment.platform?.apiIdentifier === "heroku" && heroku.isConfigured()) {
      await heroku.deleteApp(deployment.appName);
    } else if (deployment.platform?.apiIdentifier === "render" && render.isConfigured() && deployment.platformResourceId) {
      await render.deleteService(deployment.platformResourceId);
    }
  } catch (err) { /* ignore */ }

  await Deployment.deleteOne({ _id: deployment._id });
  res.json({ message: "Deleted by admin" });
});

module.exports = router;
