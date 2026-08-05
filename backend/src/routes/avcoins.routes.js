const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { User } = require("../models");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  res.json({
    balance: req.user.coins,
    earnedThisMonth: req.user.coinsEarnedThisMonth,
    totalReferrals: req.user.totalReferrals,
    referralCode: req.user.referralCode || null,
  });
});

router.get("/referral-history", protect, async (req, res) => {
  const referred = await User.find({ referredBy: req.user._id }).select("name email createdAt");
  res.json(referred);
});

router.post("/generate-referral", protect, async (req, res) => {
  if (req.user.referralCode) return res.json({ referralCode: req.user.referralCode });
  const base = (req.body.name || req.user.name || "user")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  const code = `${base}-${uuidv4().slice(0, 6)}`;
  req.user.referralCode = code;
  await req.user.save();
  res.json({ referralCode: code, shareUrl: `${process.env.FRONTEND_URL}/r/${code}` });
});

/* Admin: overview of coins across all users */
router.get("/admin/overview", protect, adminOnly, async (req, res) => {
  const users = await User.find({ coins: { $gt: 0 } })
    .select("name email coins coinsEarnedThisMonth totalReferrals")
    .sort({ coins: -1 });
  const totalIssued = users.reduce((sum, u) => sum + u.coins, 0);
  res.json({ totalIssued, users });
});

module.exports = router;
