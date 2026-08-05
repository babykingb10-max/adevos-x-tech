const axios = require("axios");

// Sends a WhatsApp text message via Meta's WhatsApp Cloud API.
// Used to notify the admin number when a manual payment proof is submitted,
// and can be reused for any other admin alert.
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
function isConfigured() {
  return Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

async function sendWhatsAppMessage(toNumber, message) {
  if (!isConfigured()) {
    console.log("[whatsapp] Not configured — skipping message:", message);
    return null;
  }
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const { data } = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to: toNumber,
      type: "text",
      text: { body: message },
    },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
  );
  return data;
}

async function notifyAdminOfManualPayment(transaction, user) {
  const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
  if (!adminNumber) return;
  const message =
    `New manual payment submitted.\n` +
    `User: ${user.name} (${user.email})\n` +
    `Plan: ${transaction.plan} | Duration: ${transaction.durationWeeks} weeks\n` +
    `Amount: ${transaction.amount} ${transaction.currency}\n` +
    `Reference: ${transaction.proofReference || "(screenshot only)"}\n` +
    `Review in the Admin App under Payment > Pending.`;
  return sendWhatsAppMessage(adminNumber, message);
}

module.exports = { isConfigured, sendWhatsAppMessage, notifyAdminOfManualPayment };
