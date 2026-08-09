const mongoose = require("mongoose");

// Admin-configurable hosting platforms (Heroku, Railway, Render, etc.)
const DeploymentPlatformSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String, required: true },
    apiIdentifier: {
      type: String,
      enum: ["heroku", "railway", "render", "flyio", "koyeb", "pterodactyl", "replit", "other"],
      required: true,
    },
    badge: { type: String, enum: ["none", "recommended", "slow", "issues"], default: "none" },
    // Naming rules used to auto-generate valid app names on this platform
    appNameRules: {
      lowercaseOnly: { type: Boolean, default: true },
      maxLength: { type: Number, default: 30 },
      allowedPattern: { type: String, default: "^[a-z][a-z0-9-]*$" },
    },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Background music playable during the deployment flow
const DeploymentMusicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A single deployed bot instance belonging to a user
const DeploymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bot: { type: mongoose.Schema.Types.ObjectId, ref: "Bot", required: true },
    plan: { type: String, enum: ["user", "deployer"], required: true },
    platform: { type: mongoose.Schema.Types.ObjectId, ref: "DeploymentPlatform", required: true },

    appName: { type: String, required: true }, // generated per-platform naming rules
    ownerName: { type: String, required: true },
    ownerNumber: { type: String, required: true },

    sessionId: { type: String, required: true }, // ONLY this goes into the bot's env at deploy time

    status: {
      type: String,
      enum: ["queued", "building", "active", "failed", "stopped", "deleted"],
      default: "queued",
    },
    buildLogs: { type: [String], default: [] },

    packageDurationWeeks: { type: Number, required: true },
    expiresAt: { type: Date, required: true },

    platformResourceId: { type: String, default: "" }, // Heroku app id / Railway service id, etc.
  },
  { timestamps: true }
);

// Enforce: a "user" plan account can only have ONE active (non-deleted/non-stopped) deployment
DeploymentSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["queued", "building", "active"] }, plan: "user" },
  }
);

module.exports = {
  DeploymentPlatform: mongoose.model("DeploymentPlatform", DeploymentPlatformSchema),
  DeploymentMusic: mongoose.model("DeploymentMusic", DeploymentMusicSchema),
  Deployment: mongoose.model("Deployment", DeploymentSchema),
};
