const axios = require("axios");

let cache = { rates: null, fetchedAt: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Uses exchangerate-api.com's "latest" endpoint. Swap providers by changing
// only this function if you prefer currencyapi.com or another service.
async function getLiveRates() {
  const now = Date.now();
  if (cache.rates && now - cache.fetchedAt < CACHE_TTL_MS) return cache.rates;

  const base = process.env.EXCHANGE_RATE_BASE_CURRENCY || "USD";
  const key = process.env.EXCHANGE_RATE_API_KEY;

  if (!key) {
    // Fallback static rates so the site keeps working before this key is set.
    return { base, rates: { USD: 1, TZS: 2600, KES: 129, UGX: 3800, RWF: 1300 }, live: false };
  }

  const { data } = await axios.get(
    `https://v6.exchangerate-api.com/v6/${key}/latest/${base}`
  );
  cache = {
    rates: { base, rates: data.conversion_rates, live: true },
    fetchedAt: now,
  };
  return cache.rates;
}

module.exports = { getLiveRates };
