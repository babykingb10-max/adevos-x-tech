const mongoose = require("mongoose");

/* ---------- Support card (single card: description + 3 links) ---------- */
const SupportSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    communityUrl: { type: String, default: "" },
    communityIcon: { type: String, default: "community" },
    whatsappUrl: { type: String, default: "" },
    whatsappIcon: { type: String, default: "whatsapp" },
    telegramUrl: { type: String, default: "" },
    telegramIcon: { type: String, default: "telegram" },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------- Client feedback (testimonial cards, horizontal scroll) ---------- */
const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    message: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------- Stay Connected (single card: social icons + subscribe) ---------- */
const StayConnectedLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true }, // "facebook" | "instagram" | "tiktok" | "youtube" | "twitter" | "telegram" | "whatsapp"
  icon: { type: String, required: true },
  url: { type: String, required: true },
  order: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },
});

/* ---------- Footer link groups: Services / Company / Legal / Resources ---------- */
const FooterLinkSchema = new mongoose.Schema({
  group: {
    type: String,
    enum: ["services", "company", "legal", "resources"],
    required: true,
  },
  label: { type: String, required: true },
  url: { type: String, required: true }, // internal route or external URL
  order: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },
});

/* ---------- Hamburger menu items (Home, Updates, Bot Deployment, AV Coins, Tutorials, Feedback, My Account) ---------- */
const MenuSubItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    destination: { type: String, required: true }, // internal route or popup key
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const MenuItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    icon: { type: String, required: true },
    destination: { type: String, default: "" }, // used when there's no sub-menu (e.g. AV Coins, My Account)
    subItems: { type: [MenuSubItemSchema], default: [] },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------- Updates (Updates pop-up/banner) ---------- */
const UpdateSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    description: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------- Per-user "read" tracking for Updates (drives the unread badge/count) ---------- */
const UpdateReadReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    update: { type: mongoose.Schema.Types.ObjectId, ref: "Update", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
UpdateReadReceiptSchema.index({ user: 1, update: 1 }, { unique: true });

/* ---------- Tutorials ---------- */
const TutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "graduation-cap" },
    videoUrl: { type: String, default: "" },
    youtubeUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------- Feedback / Reports submitted BY users (Responses in admin) ---------- */
const ResponseSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ["bug", "feature_request", "general"], required: true },
    message: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["new", "in_review", "resolved"], default: "new" },
  },
  { timestamps: true }
);

/* ---------- Feedback shown publicly on homepage (Client feedback), managed separately from user Responses ---------- */

/* ---------- Banners / pop-ups (generic editable content blocks) ---------- */
const BannerSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. "sign_in_intro", "plan_choosing_intro"
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = {
  Support: mongoose.model("Support", SupportSchema),
  Testimonial: mongoose.model("Testimonial", TestimonialSchema),
  StayConnectedLink: mongoose.model("StayConnectedLink", StayConnectedLinkSchema),
  FooterLink: mongoose.model("FooterLink", FooterLinkSchema),
  MenuItem: mongoose.model("MenuItem", MenuItemSchema),
  Update: mongoose.model("Update", UpdateSchema),
  UpdateReadReceipt: mongoose.model("UpdateReadReceipt", UpdateReadReceiptSchema),
  Tutorial: mongoose.model("Tutorial", TutorialSchema),
  Response: mongoose.model("Response", ResponseSchema),
  Banner: mongoose.model("Banner", BannerSchema),
};
