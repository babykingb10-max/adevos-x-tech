const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");
const { v4: uuidv4 } = require("uuid");
const { User } = require("../models");
const { signToken, sendTokenCookie } = require("../utils/token");
const { protect } = require("../middleware/auth");
const { emitLiveEvent } = require("../utils/liveEvents");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || 5),
  message: { message: "Too many login attempts. Try again later." },
});

function generateReferralCode(name) {
  const base = (name || "user").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return `${base}-${uuidv4().slice(0, 6)}`;
}

/* ---------------- Email/password signup ---------------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Account already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken(user);
    sendTokenCookie(res, token);
    emitLiveEvent(req.app, `New account created: ${user.email}`);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- Email/password login ---------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    sendTokenCookie(res, token);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------------- Google Sign-In (public site) ---------------- */
// Expects { idToken, referralCode? } from Google Identity Services on the frontend
router.post("/google", async (req, res) => {
  try {
    const { idToken, referralCode } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      let referredBy = null;
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) referredBy = referrer._id;
      }
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture || "",
        referredBy,
      });

      if (referredBy) {
        const bonus = Number(process.env.REFERRAL_SIGNUP_BONUS_COINS || 50);
        await User.findByIdAndUpdate(referredBy, {
          $inc: { coins: bonus, coinsEarnedThisMonth: bonus, totalReferrals: 1 },
        });
      }
      emitLiveEvent(req.app, `New account created via Google: ${user.email}`);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    sendTokenCookie(res, token);
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ message: "Google sign-in failed", error: err.message });
  }
});

/* ---------------- Admin login: username/password OR Google (allow-list) ---------------- */
router.post("/admin/login", adminLoginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    let admin = await User.findOne({ email: `${username}@admin.local` });
    if (!admin) {
      admin = await User.create({
        name: "Admin",
        email: `${username}@admin.local`,
        role: "admin",
      });
    }
    const token = signToken(admin);
    sendTokenCookie(res, token);
    return res.json({ user: admin, token });
  }
  res.status(401).json({ message: "Invalid admin credentials" });
});

router.post("/admin/google", adminLoginLimiter, async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const allowList = (process.env.ADMIN_ALLOWED_GOOGLE_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    if (!allowList.includes(payload.email.toLowerCase())) {
      return res.status(403).json({ message: "This Google account is not authorized for admin access" });
    }

    let admin = await User.findOne({ email: payload.email.toLowerCase() });
    if (!admin) {
      admin = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture || "",
        role: "admin",
      });
    } else if (admin.role !== "admin") {
      admin.role = "admin";
      await admin.save();
    }

    const token = signToken(admin);
    sendTokenCookie(res, token);
    res.json({ user: admin, token });
  } catch (err) {
    res.status(401).json({ message: "Admin Google sign-in failed", error: err.message });
  }
});

/* ---------------- Current user + logout ---------------- */
router.get("/me", protect, (req, res) => res.json(req.user));

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

router.get("/generate-referral", protect, async (req, res) => {
  if (req.user.referralCode) return res.json({ referralCode: req.user.referralCode });
  const code = generateReferralCode(req.user.name);
  req.user.referralCode = code;
  await req.user.save();
  res.json({ referralCode: code });
});

module.exports = router;
