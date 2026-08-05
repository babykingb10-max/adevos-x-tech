const express = require("express");
const { User, Update, UpdateReadReceipt } = require("../models");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

/* ---------------- Admin: user management ---------------- */
router.get("/", protect, adminOnly, async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

router.patch("/:id/block", protect, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json(user);
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Removed" });
});

router.patch("/:id/plan", protect, adminOnly, async (req, res) => {
  const { plan } = req.body; // "not_configured" | "user" | "deployer"
  const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
});

router.patch("/:id/package", protect, adminOnly, async (req, res) => {
  const { durationWeeks, extendDays } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });

  if (extendDays) {
    const base = user.activePackage.expiresAt && user.activePackage.expiresAt > new Date()
      ? user.activePackage.expiresAt
      : new Date();
    base.setDate(base.getDate() + Number(extendDays));
    user.activePackage.expiresAt = base;
  }
  if (durationWeeks) user.activePackage.durationWeeks = durationWeeks;
  await user.save();
  res.json(user);
});

/* ---------------- Self-service: profile + theme + own account ---------------- */
router.put("/me/profile", protect, async (req, res) => {
  const { name, avatarUrl, theme } = req.body;
  if (name !== undefined) req.user.name = name;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  if (theme !== undefined) req.user.theme = theme;
  await req.user.save();
  res.json(req.user);
});

module.exports = router;
