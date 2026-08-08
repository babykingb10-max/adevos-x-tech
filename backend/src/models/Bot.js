const mongoose = require("mongoose");

// Catalogue entry shown on the "Available bots" page (both User + Deployer plan)
const BotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Adevos-X Bot"
    slug: { type: String, required: true, unique: true }, // used to build deployment app names
    description: { type: String, required: true },
    author: { type: String, default: "Adevos" },
    imageUrl: { type: String, required: true },

    isFree: { type: Boolean, default: false }, // true only for "Adevos Min-Bot"
    freeWebsiteUrl: { type: String, default: "" }, // used only when isFree = true ("Visit website")

    githubRepoUrl: { type: String, default: "" },
    pairSiteUrl: { type: String, default: "" }, // per-bot device/number pairing site

    badge: { type: String, enum: ["none", "popular", "new", "beta"], default: "none" },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    availableForPlans: {
      type: [String],
      enum: ["user", "deployer"],
      default: ["user", "deployer"],
    },

    // If set, only these platforms are offered on the Deployment page for
    // this bot. If empty, ALL active platforms are offered (default behavior).
    platforms: [{ type: mongoose.Schema.Types.ObjectId, ref: "DeploymentPlatform" }],

    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Per-user rating (one rating per user per bot)
const BotRatingSchema = new mongoose.Schema(
  {
    bot: { type: mongoose.Schema.Types.ObjectId, ref: "Bot", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stars: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);
BotRatingSchema.index({ bot: 1, user: 1 }, { unique: true });

module.exports = {
  Bot: mongoose.model("Bot", BotSchema),
  BotRating: mongoose.model("BotRating", BotRatingSchema),
};
