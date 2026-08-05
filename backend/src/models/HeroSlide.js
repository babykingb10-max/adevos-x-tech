const mongoose = require("mongoose");

// Powers the homepage Hero Slider (4 slides, action button per slide)
const HeroSlideSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    buttonLabel: { type: String, required: true },

    // Where the button goes: an internal route (endpoint) or external link
    actionType: { type: String, enum: ["internal", "external"], default: "internal" },
    actionTarget: { type: String, required: true }, // e.g. "/av-coins" or "https://..."

    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HeroSlide", HeroSlideSchema);
