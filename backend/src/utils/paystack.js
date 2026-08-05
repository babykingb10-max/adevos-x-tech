const axios = require("axios");
const crypto = require("crypto");

// Docs: https://paystack.com/docs/api/transaction/
const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
});

function isConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

// Initializes a transaction and returns an `authorization_url` the frontend
// redirects the user to (Paystack-hosted checkout page).
async function initializeTransaction({ email, amountInSubunits, currency = "NGN", reference, callbackUrl, metadata }) {
  const { data } = await paystack.post("/transaction/initialize", {
    email,
    amount: amountInSubunits, // Paystack expects the smallest currency unit (e.g. kobo)
    currency,
    reference,
    callback_url: callbackUrl,
    metadata,
  });
  return data.data; // { authorization_url, access_code, reference }
}

async function verifyTransaction(reference) {
  const { data } = await paystack.get(`/transaction/verify/${reference}`);
  return data.data; // includes status: "success" | "failed", amount, metadata
}

// Verifies the `x-paystack-signature` header on incoming webhooks using HMAC SHA512.
function verifyWebhookSignature(rawBody, signatureHeader) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signatureHeader;
}

module.exports = { isConfigured, initializeTransaction, verifyTransaction, verifyWebhookSignature };
