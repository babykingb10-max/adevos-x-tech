const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");
const { v4: uuidv4 } = require("uuid");
const { User } = require("../models");
const { signToken, sendTokenCookie } = require("../utils/token");
const { protect } = require("../middleware/auth");
const { emitLiveEvent } = require("../utils/liveEvents");
const { sendOtpEmail } = require("../utils/email");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || 5),
  message: { message: "Too many login attempts. Try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts. Please wait a few minutes and try again." },
});

function generateReferralCode(name) {
  const base = (name || "user").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return `${base}-${uuidv4().slice(0, 6)}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function grantSignupBonuses(user) {
  const welcomeBonus = Number(process.env.SIGNUP_WELCOME_BONUS_COINS || 0);
  if (welcomeBonus > 0) {
    user.coins += welcomeBonus;
    user.coinsEarnedThisMonth += welcomeBonus;
    await user.save();
  }
  if (user.referredBy) {
    const referralBonus = Number(process.env.REFERRAL_SIGNUP_BONUS_COINS || 50);
    await User.findByIdAndUpdate(user.referredBy, {
      $inc: { coins: referralBonus, coinsEarnedThisMonth: referralBonus, totalReferrals: 1 },
    });
  }
}

router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.emailVerified) {
      return res.status(409).json({ message: "Account already exists" });
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer && referrer.email.toLowerCase() !== email.toLowerCase()) referredBy = referrer._id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user;
    if (existing && !existing.emailVerified) {
      existing.name = name;
      existing.passwordHash = passwordHash;
      existing.referredBy = referredBy;
      existing.otpCode = otpCode;
      existing.otpExpiresAt = otpExpiresAt;
      user = await existing.save();
    } else {
      user = await User.create({
        name, email, passwordHash, referredBy, otpCode, otpExpiresAt, emailVerified: false,
      });
    }

    await sendOtpEmail(user.email, user.name, otpCode);
    res.status(201).json({ pendingVerification: true, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/verify-otp", authLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !user.otpCode) return res.status(400).json({ message: "No pending verification for this email" });
    if (user.otpExpiresAt < new Date()) return res.status(400).json({ message: "Code expired — request a new one" });
    if (user.otpCode !== code) return res.status(400).json({ message: "Incorrect code" });

    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.lastLoginAt = new Date();
    await user.save();

    await grantSignupBonuses(user);

    const token = signToken(user);
    sendTokenCookie(res, token);
    emitLiveEvent(req.app, `New account verified: ${user.email}`);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/resend-otp", authLimiter, async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || user.emailVerified) return res.status(400).json({ message: "No pending verification for this email" });

  user.otpCode = generateOtp();
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendOtpEmail(user.email, user.name, user.otpCode);
  res.json({ message: "Code resent" });
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });

    if (!user.emailVerified) {
      user.otpCode = generateOtp();
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(user.email, user.name, user.otpCode);
      return res.status(403).json({ message: "Please verify your email — a new code was just sent.", pendingVerification: true, email: user.email });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    sendTokenCookie(res, token);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
        if (referrer && referrer.email.toLowerCase() !== payload.email.toLowerCase()) referredBy = referrer._id;
      }
      user = await User.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        avatarUrl: payload.picture || "",
        referredBy,
        emailVerified: true,
      });

      await grantSignupBonuses(user);
      emitLiveEvent(req.app, `New account created via Google: ${user.email}`);
    }

    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    sendTokenCookie(res, token);
    res.json({ user, token });
  } catch (err) {
    res.status(401).json({ message: "Google sign-in failed", error: err.message });
  }
});

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
        emailVerified: true,
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
        emailVerified: true,
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