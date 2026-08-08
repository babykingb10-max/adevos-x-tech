const express = require("express");
const { Bot, BotRating } = require("../models/Bot");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

/* Public: list bots for a given plan */
router.get("/", async (req, res) => {
  const { plan } = req.query; // "user" | "deployer"
  const filter = { isHidden: false };
  if (plan) filter.availableForPlans = plan;
  const bots = await Bot.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(bots);
});

router.get("/:id", async (req, res) => {
  const bot = await Bot.findById(req.params.id).populate("platforms");
  if (!bot) return res.status(404).json({ message: "Not found" });
  res.json(bot);
});

/* Authenticated: rate a bot (one rating per user, upserted) */
router.post("/:id/rate", protect, async (req, res) => {
  const { stars } = req.body;
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: "stars must be between 1 and 5" });
  }
  await BotRating.findOneAndUpdate(
    { bot: req.params.id, user: req.user._id },
    { stars },
    { upsert: true, new: true }
  );

  const ratings = await BotRating.find({ bot: req.params.id });
  const avg = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;

  const bot = await Bot.findByIdAndUpdate(
    req.params.id,
    { ratingAverage: Math.round(avg * 10) / 10, ratingCount: ratings.length },
    { new: true }
  );
  res.json(bot);
});

/* Admin CRUD */
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  res.json(await Bot.find().populate("platforms").sort({ order: 1 }));
});
router.post("/", protect, adminOnly, async (req, res) => {
  res.status(201).json(await Bot.create(req.body));
});
router.put("/:id", protect, adminOnly, async (req, res) => {
  const bot = await Bot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!bot) return res.status(404).json({ message: "Not found" });
  res.json(bot);
});
router.patch("/:id/hide", protect, adminOnly, async (req, res) => {
  const bot = await Bot.findById(req.params.id);
  if (!bot) return res.status(404).json({ message: "Not found" });
  bot.isHidden = !bot.isHidden;
  await bot.save();
  res.json(bot);
});
router.delete("/:id", protect, adminOnly, async (req, res) => {
  const bot = await Bot.findByIdAndDelete(req.params.id);
  if (!bot) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
});

module.exports = router;
