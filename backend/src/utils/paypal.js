const axios = require("axios");

// Docs: https://developer.paypal.com/docs/api/orders/v2/
function baseUrl() {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function isConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getAccessToken() {
  const { data } = await axios.post(
    `${baseUrl()}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: { username: process.env.PAYPAL_CLIENT_ID, password: process.env.PAYPAL_CLIENT_SECRET },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  return data.access_token;
}

// Creates an order; the frontend uses the returned order `id` with the PayPal
// JS SDK buttons (client-side approval), then this backend captures it below.
async function createOrder({ amount, currency = "USD", reference }) {
  const token = await getAccessToken();
  const { data } = await axios.post(
    `${baseUrl()}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        { reference_id: reference, amount: { currency_code: currency, value: amount.toFixed(2) } },
      ],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data; // { id, status, links }
}

async function captureOrder(orderId) {
  const token = await getAccessToken();
  const { data } = await axios.post(
    `${baseUrl()}/v2/checkout/orders/${orderId}/capture`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data; // data.status === "COMPLETED" when successful
}

module.exports = { isConfigured, getAccessToken, createOrder, captureOrder };
