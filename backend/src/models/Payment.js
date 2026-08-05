const mongoose = require("mongoose");

// Admin-configurable list of Available Payment methods shown on the Payment page
const PaymentMethodSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ["av_coins", "manual", "paystack", "paypal"], required: true, unique: true },
    label: { type: String, required: true },
    icon: { type: String, required: true },
    availableForPlans: { type: [String], enum: ["user", "deployer"], default: ["user", "deployer"] },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Package durations + pricing per plan (2 / 4 / 8 weeks)
const PackageSchema = new mongoose.Schema(
  {
    plan: { type: String, enum: ["user", "deployer"], required: true },
    durationWeeks: { type: Number, enum: [2, 4, 8], required: true },
    priceCoins: { type: Number, default: null }, // used only for user plan + av_coins
    priceUSD: { type: Number, required: true }, // base currency price, converted for display
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);
PackageSchema.index({ plan: 1, durationWeeks: 1 }, { unique: true });

// A single payment/transaction record
const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["user", "deployer"], required: true },
    durationWeeks: { type: Number, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    method: { type: String, enum: ["av_coins", "manual", "paystack", "paypal"], required: true },

    status: {
      type: String,
      enum: ["pending", "awaiting_admin_review", "confirmed", "failed", "cancelled"],
      default: "pending",
    },

    // Manual payment proof
    proofReference: { type: String, default: "" }, // transaction ID user submits
    proofScreenshotUrl: { type: String, default: "" },

    // Provider references
    providerReference: { type: String, default: "" }, // Paystack/PayPal transaction id
    providerRaw: { type: mongoose.Schema.Types.Mixed, default: null }, // raw webhook payload for audit

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // admin who confirmed manual payment
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = {
  PaymentMethod: mongoose.model("PaymentMethod", PaymentMethodSchema),
  Package: mongoose.model("Package", PackageSchema),
  Transaction: mongoose.model("Transaction", TransactionSchema),
};
