const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // null if Google-only account
    googleId: { type: String },
    avatarUrl: { type: String, default: "" }, // stored image (uploaded, kept in localStorage on client + synced here)

    plan: {
      type: String,
      enum: ["not_configured", "user", "deployer"],
      default: "not_configured",
    },

    theme: {
      type: String,
      enum: ["system", "light", "dark"],
      default: "system",
    },

    // AV Coins
    coins: { type: Number, default: 0 },
    coinsEarnedThisMonth: { type: Number, default: 0 },

    // Referral system
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    totalReferrals: { type: Number, default: 0 },

    // Subscription (active package)
    activePackage: {
      paymentMethod: { type: String, enum: ["av_coins", "manual", "paystack", "paypal", null], default: null },
      durationWeeks: { type: Number, default: null }, // 2, 4, 8
      startedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
