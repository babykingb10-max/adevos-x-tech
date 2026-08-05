const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { PaymentMethod, Package, Transaction, User } = require("../models");
const { protect, adminOnly } = require("../middleware/auth");
const paystack = require("../utils/paystack");
const paypal = require("../utils/paypal");
const whatsapp = require("../utils/whatsapp");
const email = require("../utils/email");
const { getLiveRates } = require("../utils/currency");
const { emitLiveEvent } = require("../utils/liveEvents");

const router = express.Router();

/* ---------------- Public: payment methods + packages ---------------- */
router.get("/methods", async (req, res) => {
  const { plan } = req.query;
  const filter = { isHidden: false };
  if (plan) filter.availableForPlans = plan;
  res.json(await PaymentMethod.find(filter));
});

router.get("/packages", async (req, res) => {
  const { plan } = req.query;
  const filter = { isHidden: false };
  if (plan) filter.plan = plan;
  res.json(await Package.find(filter).sort({ durationWeeks: 1 }));
});

router.get("/currency-rates", async (req, res) => {
  try {
    const rates = await getLiveRates();
    res.json(rates);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch exchange rates", error: err.message });
  }
});

/* ---------------- Authenticated: create a transaction ---------------- */
router.post("/transactions", protect, async (req, res) => {
  const { plan, durationWeeks, method, currency } = req.body;

  const pkg = await Package.findOne({ plan, durationWeeks });
  if (!pkg) return res.status(400).json({ message: "Invalid package selection" });

  /* ---- AV Coins ---- */
  if (method === "av_coins") {
    if (plan !== "user") return res.status(400).json({ message: "AV Coins only available for user plan" });
    if (req.user.coins < pkg.priceCoins) {
      return res.status(402).json({ message: "Insufficient AV Coins balance", required: pkg.priceCoins, available: req.user.coins });
    }
    req.user.coins -= pkg.priceCoins;
    await req.user.save();

    const tx = await Transaction.create({
      user: req.user._id, plan, durationWeeks, amount: pkg.priceCoins, currency: "AV",
      method: "av_coins", status: "confirmed",
    });
    await activatePlan(req.user._id, plan, durationWeeks, "av_coins");
    emitLiveEvent(req.app, `${req.user.name} paid with AV Coins for ${plan} plan (${durationWeeks}w)`);
    return res.status(201).json(tx);
  }

  /* ---- Manual payment ---- */
  if (method === "manual") {
    const tx = await Transaction.create({
      user: req.user._id, plan, durationWeeks, amount: pkg.priceUSD, currency: currency || "USD",
      method: "manual", status: "pending",
    });
    return res.status(201).json({
      transaction: tx,
      instructions: {
        payTo: process.env.MANUAL_PAYMENT_NAME,
        numbers: process.env.MANUAL_PAYMENT_NUMBERS,
        note: "Send payment then submit your transaction reference or screenshot for review.",
      },
    });
  }

  /* ---- Paystack ---- */
  if (method === "paystack") {
    const reference = `adx_${uuidv4()}`;
    const tx = await Transaction.create({
      user: req.user._id, plan, durationWeeks, amount: pkg.priceUSD, currency: currency || "NGN",
      method: "paystack", status: "pending", providerReference: reference,
    });

    if (!paystack.isConfigured()) {
      return res.status(201).json({ transaction: tx, note: "PAYSTACK_SECRET_KEY not set — cannot open live checkout yet." });
    }

    const initialized = await paystack.initializeTransaction({
      email: req.user.email,
      amountInSubunits: Math.round(pkg.priceUSD * 100),
      currency: currency || "NGN",
      reference,
      callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: { userId: req.user._id.toString(), transactionId: tx._id.toString(), plan, durationWeeks },
    });
    return res.status(201).json({ transaction: tx, checkoutUrl: initialized.authorization_url });
  }

  /* ---- PayPal ---- */
  if (method === "paypal") {
    const tx = await Transaction.create({
      user: req.user._id, plan, durationWeeks, amount: pkg.priceUSD, currency: "USD",
      method: "paypal", status: "pending",
    });

    if (!paypal.isConfigured()) {
      return res.status(201).json({ transaction: tx, note: "PAYPAL_CLIENT_ID/SECRET not set — cannot open live checkout yet." });
    }

    const order = await paypal.createOrder({ amount: pkg.priceUSD, currency: "USD", reference: tx._id.toString() });
    tx.providerReference = order.id;
    await tx.save();
    return res.status(201).json({ transaction: tx, orderId: order.id });
  }

  return res.status(400).json({ message: "Unknown payment method" });
});

/* Frontend calls this after the PayPal JS SDK buttons approve the order */
router.post("/paypal/:orderId/capture", protect, async (req, res) => {
  const tx = await Transaction.findOne({ providerReference: req.params.orderId, user: req.user._id });
  if (!tx) return res.status(404).json({ message: "Transaction not found" });

  const result = await paypal.captureOrder(req.params.orderId);
  if (result.status === "COMPLETED") {
    tx.status = "confirmed";
    await tx.save();
    await activatePlan(tx.user, tx.plan, tx.durationWeeks, "paypal");
    emitLiveEvent(req.app, `Payment confirmed via PayPal for ${tx.plan} plan`);
  }
  res.json({ status: result.status, transaction: tx });
});

/* Submit proof for a manual payment (reference number or screenshot URL) */
router.post("/transactions/:id/proof", protect, async (req, res) => {
  const { proofReference, proofScreenshotUrl } = req.body;
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) return res.status(404).json({ message: "Not found" });

  tx.proofReference = proofReference || tx.proofReference;
  tx.proofScreenshotUrl = proofScreenshotUrl || tx.proofScreenshotUrl;
  tx.status = "awaiting_admin_review";
  await tx.save();

  await whatsapp.notifyAdminOfManualPayment(tx, req.user);
  emitLiveEvent(req.app, `${req.user.name} submitted manual payment proof — awaiting review`);
  res.json(tx);
});

router.get("/transactions/mine", protect, async (req, res) => {
  res.json(await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

/* ---------------- Webhooks (auto-confirm) ---------------- */
// Mounted with express.raw() in server.js so we can verify the raw-body signature
router.post("/webhooks/paystack", async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const rawBody = req.body; // Buffer, thanks to express.raw() in server.js
  if (!paystack.verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const event = JSON.parse(rawBody.toString());
  if (event.event === "charge.success") {
    const reference = event.data.reference;
    const tx = await Transaction.findOne({ providerReference: reference });
    if (tx && tx.status !== "confirmed") {
      tx.status = "confirmed";
      tx.providerRaw = event.data;
      await tx.save();
      await activatePlan(tx.user, tx.plan, tx.durationWeeks, "paystack");
      emitLiveEvent(req.app, `Payment confirmed via Paystack for ${tx.plan} plan`);
    }
  }
  res.sendStatus(200);
});

router.post("/webhooks/paypal", express.json(), async (req, res) => {
  // TODO: verify the webhook signature using PayPal's transmission headers before trusting this.
  // See: https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
  res.sendStatus(200);
});

/* ---------------- Shared: activate a user's plan/package after confirmation ---------------- */
async function activatePlan(userId, plan, durationWeeks, method) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(durationWeeks) * 7);
  const user = await User.findByIdAndUpdate(
    userId,
    { plan, activePackage: { paymentMethod: method, durationWeeks, startedAt: new Date(), expiresAt } },
    { new: true }
  );
  if (user) await email.sendPaymentConfirmedEmail(user.email, user.name, plan, durationWeeks);
  return user;
}

/* ---------------- Admin ---------------- */
router.get("/admin/pending", protect, adminOnly, async (req, res) => {
  res.json(
    await Transaction.find({ status: { $in: ["pending", "awaiting_admin_review"] } })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
  );
});

router.patch("/admin/transactions/:id/confirm", protect, adminOnly, async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: "Not found" });

  tx.status = "confirmed";
  tx.reviewedBy = req.user._id;
  tx.reviewedAt = new Date();
  await tx.save();

  await activatePlan(tx.user, tx.plan, tx.durationWeeks, tx.method);
  emitLiveEvent(req.app, `Admin confirmed a manual payment (${tx.plan} plan)`);
  res.json(tx);
});

router.patch("/admin/transactions/:id/cancel", protect, adminOnly, async (req, res) => {
  const tx = await Transaction.findByIdAndUpdate(
    req.params.id,
    { status: "failed", reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  );
  if (!tx) return res.status(404).json({ message: "Not found" });
  res.json(tx);
});

module.exports = router;
