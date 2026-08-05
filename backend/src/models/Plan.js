const mongoose = require("mongoose");

// User plan / Deployer plan — shown on the plan-choosing popup
const PlanSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ["user", "deployer"], required: true, unique: true },
    heading: { type: String, required: true },
    description: { type: String, required: true },
    features: { type: [String], default: [] }, // bullet points, e.g. "1 active bot", "Standard support"
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
