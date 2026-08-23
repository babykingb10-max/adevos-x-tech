const { User, Deployment } = require("../models");
const { emitLiveEvent, broadcastContentChange } = require("./liveEvents");

// Implements the spec requirement: "Kama user muda wake umeisha huduma zake
// zitazimwa automatically na kufutwa kabisa" — when a subscription's
// expiresAt passes, the bot is torn down on its hosting platform AND the
// Deployment record is deleted, and the user's plan resets so they see
// "No active plan" again until they pay/get granted a new one.
async function checkExpiredSubscriptions(app) {
  const now = new Date();
  const platformHandlers = require("../routes/deployment.routes").platformHandlers;

  const expiredDeployments = await Deployment.find({
    expiresAt: { $lt: now },
    status: { $in: ["queued", "building", "active", "stopped"] },
  }).populate("platform").populate("user", "name email");

  for (const deployment of expiredDeployments) {
    try {
      const handler = platformHandlers[deployment.platform?.apiIdentifier] || platformHandlers.other;
      await handler.remove(deployment);
    } catch (err) {
      console.error(`[expiryCheck] Failed to remove ${deployment.appName} from platform:`, err.message);
    }
    await Deployment.deleteOne({ _id: deployment._id });
    emitLiveEvent(app, `Subscription expired — removed bot "${deployment.appName}" for ${deployment.user?.email || "a user"}`);
  }

  // Reset any user whose package has lapsed but who still shows an active plan
  // (covers users with no deployment yet, or whose deployment was already gone).
  const expiredUsers = await User.updateMany(
    { "activePackage.expiresAt": { $lt: now }, plan: { $ne: "not_configured" } },
    { plan: "not_configured", activePackage: { paymentMethod: null, durationWeeks: null, startedAt: null, expiresAt: null } }
  );

  if (expiredDeployments.length || expiredUsers.modifiedCount) {
    broadcastContentChange(app, "bots"); // in case any "Available bots" view depends on freed-up state
  }
}

// Runs once an hour. Only effective while the Heroku dyno is awake — on the
// free/eco tier a sleeping dyno pauses this until the next request wakes it,
// which is an acceptable tradeoff for this project's scale.
function startExpiryCheckJob(app) {
  const HOUR = 60 * 60 * 1000;
  checkExpiredSubscriptions(app).catch((err) => console.error("[expiryCheck] initial run failed:", err.message));
  setInterval(() => {
    checkExpiredSubscriptions(app).catch((err) => console.error("[expiryCheck] run failed:", err.message));
  }, HOUR);
}

module.exports = { checkExpiredSubscriptions, startExpiryCheckJob };