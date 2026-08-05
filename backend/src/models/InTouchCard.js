const mongoose = require("mongoose");

// "Get in touch" — 6 cards, heading + description + action button (no icon/image)
const InTouchCardSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    description: { type: String, required: true },
    buttonLabel: { type: String, required: true },

    // What the action does: open an internal route, open a popup (by key), or send a contact message
    actionType: {
      type: String,
      enum: ["internal_link", "popup", "contact"],
      default: "internal_link",
    },
    actionTarget: { type: String, required: true }, // route, popup key ("tutorials", "updates", "plan_select", "feedback"), or contact email

    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InTouchCard", InTouchCardSchema);
