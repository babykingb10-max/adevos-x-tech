const express = require("express");
const { DeploymentPlatform, DeploymentMusic, Deployment, Bot, User } = require("../models");
const { protect, adminOnly } = require("../middleware/auth");
const heroku = require("../utils/heroku");
const render = require("../utils/render");
const railway = require("../utils/railway");
const flyio = require("../utils/flyio");
const koyeb = require("../utils/koyeb");
const pterodactyl = require("../utils/pterodactyl");
const replit = require("../utils/replit");
const { emitLiveEvent } = require("../utils/liveEvents");

const router = express.Router();

/* ---------------- Public ---------------- */
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

function generateAppName(botSlug, ownerName, rules) {
  const clean = (s) =>
    (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
  const random = Math.random().toString(36).slice(2, 7);
  let name = `${clean(botSlug)}-${clean(ownerName)}-${random}`;
  if (rules?.maxLength) name = name.slice(0, rules.maxLength);
  if (!/^[a-z]/.test(name)) name = `bot-${name}`.slice(0, rules?.maxLength || 30);
  return name;
}

/* ============================================================
   PLATFORM HANDLERS — one entry per apiIdentifier. Each provides:
     deploy(io, deployment, bot)  — runs the full build, streaming
                                     logs via socket, sets final status
     restart(deployment)          — restarts the running instance
     stop(deployment)             — stops/suspends the instance
     remove(deployment)           — deletes the instance from the platform
     refreshStatus(deployment)    — re-checks real status, may mutate
                                     deployment.status (caller saves it)
   This keeps every route below to a single lookup instead of a long
   if/else chain repeated for create/restart/stop/delete/refresh.
   ============================================================ */
async function streamedDeploy(io, deployment, bot, runner) {
  const room = `deployment:${deployment._id}`;
  const pushLog = async (line) => {
    deployment.buildLogs.push(line);
    await deployment.save();
    io.to(room).emit("build-log", line);
  };
  const setStatus = async (status) => {
    deployment.status = status;
    await deployment.save();
    io.to(room).emit("build-status", status);
  };
  try {
    await runner({ pushLog, setStatus });
  } catch (err) {
    await pushLog(`Error: ${err.response?.data?.message || err.message}`);
    await setStatus("failed");
  }
}

const platformHandlers = {
  heroku: {
    deploy: (io, deployment, bot) => streamedDeploy(io, deployment, bot, async ({ pushLog, setStatus }) => {
      if (!heroku.isConfigured()) return pushLog("HEROKU_API_KEY not set — an admin can deploy this manually.");
      if (!bot.githubRepoUrl && !bot.isFree) { await pushLog("This bot has no GitHub repo configured."); return setStatus("failed"); }

      await pushLog(`Creating Heroku app "${deployment.appName}"...`);
      await heroku.createApp(deployment.appName);
      await pushLog("Setting environment variables (session ID only)...");
      await heroku.setConfigVars(deployment.appName, { SESSION_ID: deployment.sessionId });

      const repoPath = bot.githubRepoUrl.replace("https://github.com/", "").replace(/\.git$/, "");
      const tarballUrl = `https://github.com/${repoPath}/tarball/main`;
      await pushLog("Starting build from source...");
      await setStatus("building");

      const build = await heroku.createBuild(deployment.appName, tarballUrl);
      deployment.platformResourceId = build.app.id;
      await deployment.save();

      let status = build.status, attempts = 0;
      while (status === "pending" && attempts < 60) {
        await new Promise((r) => setTimeout(r, 5000));
        status = (await heroku.getBuild(deployment.appName, build.id)).status;
        attempts += 1;
      }
      if (status === "succeeded") { await pushLog("Build succeeded! Your bot is now live."); await setStatus("active"); }
      else { await pushLog(`Build ${status}.`); await setStatus("failed"); }
    }),
    restart: async (d) => heroku.isConfigured() && (await heroku.restartApp(d.appName)),
    stop: async (d) => heroku.isConfigured() && (await heroku.scaleDown(d.appName)),
    remove: async (d) => heroku.isConfigured() && (await heroku.deleteApp(d.appName)),
    refreshStatus: async () => {},
  },

  render: {
    deploy: (io, deployment, bot) => streamedDeploy(io, deployment, bot, async ({ pushLog, setStatus }) => {
      if (!render.isConfigured()) return pushLog("RENDER_API_KEY not set — an admin can deploy this manually.");
      if (!bot.githubRepoUrl && !bot.isFree) { await pushLog("This bot has no GitHub repo configured."); return setStatus("failed"); }

      await pushLog(`Creating Render service "${deployment.appName}"...`);
      await setStatus("building");
      const result = await render.createService({ name: deployment.appName, repoUrl: bot.githubRepoUrl, envVars: { SESSION_ID: deployment.sessionId } });
      deployment.platformResourceId = result.service.id;
      await deployment.save();

      await pushLog("Build started — polling for status...");
      let status = "created", attempts = 0;
      while (!["live", "deactivated", "build_failed", "update_failed", "canceled"].includes(status) && attempts < 60) {
        await new Promise((r) => setTimeout(r, 5000));
        status = (await render.getLatestDeploy(deployment.platformResourceId))?.status || status;
        attempts += 1;
      }
      if (status === "live") { await pushLog("Deployment live on Render!"); await setStatus("active"); }
      else { await pushLog(`Render deploy ended with status: ${status}.`); await setStatus("failed"); }
    }),
    restart: async (d) => render.isConfigured() && d.platformResourceId && (await render.resumeService(d.platformResourceId)),
    stop: async (d) => render.isConfigured() && d.platformResourceId && (await render.suspendService(d.platformResourceId)),
    remove: async (d) => render.isConfigured() && d.platformResourceId && (await render.deleteService(d.platformResourceId)),
    refreshStatus: async (d) => {
      if (!render.isConfigured() || !d.platformResourceId) return;
      const deploy = await render.getLatestDeploy(d.platformResourceId);
      if (deploy?.status === "live") d.status = "active";
      else if (["deactivated", "build_failed", "update_failed", "canceled"].includes(deploy?.status)) d.status = "failed";
    },
  },

  railway: {
    deploy: (io, deployment, bot) => streamedDeploy(io, deployment, bot, async ({ pushLog, setStatus }) => {
      if (!railway.isConfigured()) return pushLog("RAILWAY_API_TOKEN not set — an admin can deploy this manually.");
      if (!bot.githubRepoUrl && !bot.isFree) { await pushLog("This bot has no GitHub repo configured."); return setStatus("failed"); }

      await pushLog(`Creating Railway service "${deployment.appName}"...`);
      await setStatus("building");
      const service = await railway.createServiceFromRepo({ name: deployment.appName, repoUrl: bot.githubRepoUrl });
      deployment.platformResourceId = service.id;
      await deployment.save();

      const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
      if (environmentId) {
        await railway.setVariables(service.id, environmentId, { SESSION_ID: deployment.sessionId });
        await pushLog("Environment variables set — polling for deploy status...");
        let status = "BUILDING", attempts = 0;
        while (!["SUCCESS", "FAILED", "CRASHED"].includes(status) && attempts < 60) {
          await new Promise((r) => setTimeout(r, 5000));
          status = (await railway.getLatestDeployment(service.id, environmentId))?.status || status;
          attempts += 1;
        }
        if (status === "SUCCESS") { await pushLog("Deployment live on Railway!"); await setStatus("active"); }
        else { await pushLog(`Railway deploy ended with status: ${status}.`); await setStatus("failed"); }
      } else {
        await pushLog("RAILWAY_ENVIRONMENT_ID not set — service created but env vars/status polling skipped. Configure it in the Admin App env vars.");
        await setStatus("active");
      }
    }),
    restart: async (d) => railway.isConfigured() && process.env.RAILWAY_ENVIRONMENT_ID && (await railway.restartService(d.platformResourceId, process.env.RAILWAY_ENVIRONMENT_ID)),
    stop: async () => { /* Railway has no simple pause API — leaving running; use Delete to fully remove */ },
    remove: async (d) => railway.isConfigured() && d.platformResourceId && (await railway.deleteService(d.platformResourceId)),
    refreshStatus: async (d) => {
      if (!railway.isConfigured() || !d.platformResourceId || !process.env.RAILWAY_ENVIRONMENT_ID) return;
      const dep = await railway.getLatestDeployment(d.platformResourceId, process.env.RAILWAY_ENVIRONMENT_ID);
      if (dep?.status === "SUCCESS") d.status = "active";
      else if (["FAILED", "CRASHED"].includes(dep?.status)) d.status = "failed";
    },
  },

  flyio: {
    deploy: (io, deployment, bot) => streamedDeploy(io, deployment, bot, async ({ pushLog, setStatus }) => {
      if (!flyio.isConfigured()) return pushLog("FLYIO_API_TOKEN/FLYIO_ORG_SLUG not set — an admin can deploy this manually.");
      if (!bot.githubRepoUrl && !bot.isFree) { await pushLog("This bot has no GitHub repo configured."); return setStatus("failed"); }

      await pushLog(`Creating Fly.io app "${deployment.appName}"...`);
      await setStatus("building");
      await flyio.createApp(deployment.appName);
      await pushLog("Starting machine (clones repo + npm install + npm start at boot)...");
      const machine = await flyio.createMachine({ appName: deployment.appName, repoUrl: bot.githubRepoUrl, envVars: { SESSION_ID: deployment.sessionId } });
      deployment.platformResourceId = machine.id;
      await deployment.save();

      let state = machine.state, attempts = 0;
      while (!["started", "stopped", "failed", "destroyed"].includes(state) && attempts < 30) {
        await new Promise((r) => setTimeout(r, 5000));
        state = (await flyio.getMachine(deployment.appName, machine.id))?.state || state;
        attempts += 1;
      }
      if (state === "started") { await pushLog("Machine started on Fly.io!"); await setStatus("active"); }
      else { await pushLog(`Fly.io machine ended in state: ${state}.`); await setStatus("failed"); }
    }),
    restart: async (d) => flyio.isConfigured() && d.platformResourceId && (await flyio.restartMachine(d.appName, d.platformResourceId)),
    stop: async (d) => flyio.isConfigured() && d.platformResourceId && (await flyio.stopMachine(d.appName, d.platformResourceId)),
    remove: async (d) => flyio.isConfigured() && (await flyio.deleteApp(d.appName)),
    refreshStatus: async (d) => {
      if (!flyio.isConfigured() || !d.platformResourceId) return;
      const m = await flyio.getMachine(d.appName, d.platformResourceId);
      if (m?.state === "started") d.status = "active";
      else if (["failed", "destroyed"].includes(m?.state)) d.status = "failed";
    },
  },

  koyeb: {
    deploy: (io, deployment, bot) => streamedDeploy(io, deployment, bot, async ({ pushLog, setStatus }) => {
      if (!koyeb.isConfigured()) return pushLog("KOYEB_API_TOKEN not set — an admin can deploy this manually.");
      if (!bot.githubRepoUrl && !bot.isFree) { await pushLog("This bot has no GitHub repo configured."); return setStatus("failed"); }

      await pushLog(`Creating Koyeb app "${deployment.appName}"...`);
      await setStatus("building");
      const app = await koyeb.createApp(deployment.appName);
      const service = await koyeb.createService({ appId: app.id, name: deployment.appName, repoUrl: bot.githubRepoUrl, envVars: { SESSION_ID: deployment.sessionId } });
      deployment.platformResourceId = service.id;
      await deployment.save();

      await pushLog("Build started — polling for status...");
      let status = "STARTING", attempts = 0;
      while (!["HEALTHY", "UNHEALTHY", "DEGRADED"].includes(status) && attempts < 60) {
        await new Promise((r) => setTimeout(r, 5000));
        status = (await koyeb.getService(service.id))?.status || status;
        attempts += 1;
      }
      if (status === "HEALTHY") { await pushLog("Deployment live on Koyeb!"); await setStatus("active"); }
      else { await pushLog(`Koyeb deploy ended with status: ${status}.`); await setStatus("failed"); }
    }),
    restart: async (d) => koyeb.isConfigured() && d.platformResourceId && (await koyeb.redeployService(d.platformResourceId)),
    stop: async (d) => koyeb.isConfigured() && d.platformResourceId && (await koyeb.pauseService(d.platformResourceId)),
    remove: async (d) => koyeb.isConfigured() && d.platformResourceId && (await koyeb.deleteService(d.platformResourceId)),
    refreshStatus: async (d) => {
      if (!koyeb.isConfigured() || !d.platformResourceId) return;
      const s = await koyeb.getService(d.platformResourceId);
      if (s?.status === "HEALTHY") d.status = "active";
      else if (["UNHEALTHY", "DEGRADED"].includes(s?.status)) d.status = "failed";
    },
  },

  pterodactyl: {
    deploy: (io, deployment, bot) => streamedDeploy(io, deployment, bot, async ({ pushLog, setStatus }) => {
      if (!pterodactyl.isConfigured()) return pushLog("PTERODACTYL_PANEL_URL/PTERODACTYL_API_KEY not set — an admin can deploy this manually.");
      if (!bot.githubRepoUrl && !bot.isFree) { await pushLog("This bot has no GitHub repo configured."); return setStatus("failed"); }

      await pushLog(`Creating server "${deployment.appName}" on your Pterodactyl panel...`);
      await setStatus("building");
      const server = await pterodactyl.createServer({ name: deployment.appName, repoUrl: bot.githubRepoUrl, sessionId: deployment.sessionId });
      deployment.platformResourceId = String(server.id);
      await deployment.save();
      await pushLog("Server created — it will install and start shortly.");
      await setStatus("active");
    }),
    restart: async (d) => pterodactyl.isConfigured() && d.platformResourceId && (await pterodactyl.sendPowerAction(d.platformResourceId, "restart")),
    stop: async (d) => pterodactyl.isConfigured() && d.platformResourceId && (await pterodactyl.sendPowerAction(d.platformResourceId, "stop")),
    remove: async (d) => pterodactyl.isConfigured() && d.platformResourceId && (await pterodactyl.deleteServer(d.platformResourceId)),
    refreshStatus: async () => {},
  },

  replit: {
    deploy: (io, deployment, bot) => streamedDeploy(io, deployment, bot, async ({ pushLog, setStatus }) => {
      if (!replit.isConfigured()) return pushLog("REPLIT_CONNECT_SID not set — an admin can import/deploy this Repl manually.");
      if (!bot.githubRepoUrl && !bot.isFree) { await pushLog("This bot has no GitHub repo configured."); return setStatus("failed"); }

      await pushLog("Importing repo into a new Repl (best-effort — Replit has no official public deploy API)...");
      await setStatus("building");
      const repl = await replit.importFromGithub({ repoUrl: bot.githubRepoUrl, title: deployment.appName });
      deployment.platformResourceId = repl.id;
      await deployment.save();
      await pushLog(`Repl created: ${repl.url}. Session ID must be set manually as a Replit Secret for now.`);
      await setStatus("active");
    }),
    restart: async () => { /* not supported over public API */ },
    stop: async () => { /* not supported over public API */ },
    remove: async () => { /* not supported over public API — delete manually on replit.com */ },
    refreshStatus: async () => {},
  },

  other: {
    deploy: (io, deployment) => streamedDeploy(io, deployment, null, async ({ pushLog }) => {
      await pushLog("This platform has no automated integration — an admin will deploy this manually and update the status.");
    }),
    restart: async () => {},
    stop: async () => {},
    remove: async () => {},
    refreshStatus: async () => {},
  },
};

function getHandler(apiIdentifier) {
  return platformHandlers[apiIdentifier] || platformHandlers.other;
}

/* ---------------- Authenticated ---------------- */
router.post("/", protect, async (req, res) => {
  try {
    const { botId, platformId, ownerName, ownerNumber, sessionId, durationWeeks } = req.body;

    const bot = await Bot.findById(botId);
    const platform = await DeploymentPlatform.findById(platformId);
    if (!bot || !platform) return res.status(400).json({ message: "Invalid bot or platform" });

    if (req.user.plan === "user") {
  // "failed" builds don't count — the person should be able to retry
  // without needing to delete a build that never actually worked.
  const existingBot = await Deployment.findOne({
    user: req.user._id,
    status: { $in: ["queued", "building", "active", "stopped"] },
  });
  if (existingBot) {
    return res.status(409).json({
      message: "You already have a bot deployed on the User plan. Delete it first to deploy a different one, change its owner number/platform from Bot Management instead, or upgrade to Deployer plan to run more than one bot.",
    });
  }
}

    const appName = generateAppName(bot.slug, ownerName, platform.appNameRules);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(durationWeeks || 0) * 7);

    const deployment = await Deployment.create({
      user: req.user._id, bot: bot._id, plan: req.user.plan, platform: platform._id,
      appName, ownerName, ownerNumber, sessionId, packageDurationWeeks: durationWeeks, expiresAt,
      status: "queued", buildLogs: ["Deployment queued..."],
    });

    res.status(201).json(deployment);

    const io = req.app.get("io");
    getHandler(platform.apiIdentifier).deploy(io, deployment, bot);
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
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id }).populate("bot").populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });
  res.json(deployment);
});

router.post("/:id/refresh-status", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id }).populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });
  try {
    await getHandler(deployment.platform?.apiIdentifier).refreshStatus(deployment);
    await deployment.save();
  } catch (err) { /* platform unreachable — leave status as-is */ }
  res.json(deployment);
});

router.patch("/:id/owner-info", protect, async (req, res) => {
  const { ownerName, ownerNumber } = req.body;
  const deployment = await Deployment.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, { ownerName, ownerNumber }, { new: true }
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
    await getHandler(deployment.platform?.apiIdentifier).restart(deployment);
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
  try { await getHandler(deployment.platform?.apiIdentifier).stop(deployment); } catch (err) { /* already gone */ }
  deployment.status = "stopped";
  await deployment.save();
  res.json(deployment);
});

router.delete("/:id", protect, async (req, res) => {
  const deployment = await Deployment.findOne({ _id: req.params.id, user: req.user._id }).populate("platform");
  if (!deployment) return res.status(404).json({ message: "Not found" });
  try { await getHandler(deployment.platform?.apiIdentifier).remove(deployment); } catch (err) { /* already gone */ }
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
  try { await getHandler(deployment.platform?.apiIdentifier).remove(deployment); } catch (err) { /* ignore */ }
  await Deployment.deleteOne({ _id: deployment._id });
  res.json({ message: "Deleted by admin" });
});

// Exposed so server.js's expiry-check job can reuse the exact same per-platform
// delete logic instead of duplicating it.
router.platformHandlers = platformHandlers;

module.exports = router;
