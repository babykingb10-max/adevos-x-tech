const express = require("express");
const { User, Update, UpdateReadReceipt, Deployment } = require("../models");
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

// Admin grants a plan + package directly (no payment required) — e.g. "guarantee"
// a user 2 weeks of the User plan for free. Sets activePackage.expiresAt so the
// smart-deploy flow treats it exactly like a paid, confirmed subscription.

  router.post("/:id/grant-plan", protect, adminOnly, async (req, res) => {
  const { plan, durationWeeks } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(durationWeeks) * 7);
  user.plan = plan;
  user.activePackage = { paymentMethod: "manual", durationWeeks, startedAt: new Date(), expiresAt };
  await user.save();

  // Keep it consistent with the normal payment flow: any existing bot this
  // user already has gets its plan/package synced too, not left behind.
  await Deployment.updateMany(
    { user: user._id, status: { $in: ["queued", "building", "active", "stopped"] } },
    { plan, packageDurationWeeks: durationWeeks, expiresAt }
  );

  res.json(user);
});

// Adjust one user's AV Coins balance (positive to add, negative to deduct)
router.patch("/:id/coins", protect, adminOnly, async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  user.coins = Math.max(0, user.coins + Number(amount));
  if (Number(amount) > 0) user.coinsEarnedThisMonth += Number(amount);
  await user.save();
  res.json(user);
});

// Adjust coins for multiple users at once
router.post("/bulk/coins", protect, adminOnly, async (req, res) => {
  const { userIds, amount } = req.body;
  const users = await User.find({ _id: { $in: userIds } });
  await Promise.all(
    users.map((u) => {
      u.coins = Math.max(0, u.coins + Number(amount));
      if (Number(amount) > 0) u.coinsEarnedThisMonth += Number(amount);
      return u.save();
    })
  );
  res.json({ message: `Updated ${users.length} users` });
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
