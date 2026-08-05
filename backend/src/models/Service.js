const mongoose = require("mongoose");

// "Our Services" (What we offer) — 6 cards, icon + heading + description, no action button
const ServiceSchema = new mongoose.Schema(
  {
    icon: { type: String, required: true }, // icon key from the shared icon set, e.g. "code", "whatsapp", "rocket"
    heading: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);
