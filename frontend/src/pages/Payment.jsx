import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import { getIcon } from "../lib/icons";

export default function Payment() {
  const [params] = useSearchParams();
  const plan = params.get("plan") || "user";
  const botId = params.get("bot");
  const navigate = useNavigate();

  const [methods, setMethods] = useState([]);
  const [packages, setPackages] = useState([]);
  const [rates, setRates] = useState(null);
  const [method, setMethod] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [tx, setTx] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [proofRef, setProofRef] = useState("");

  useEffect(() => {
    api.get(`/payments/methods?plan=${plan}`).then((r) => setMethods(r.data)).catch(() => {});
    api.get(`/payments/packages?plan=${plan}`).then((r) => setPackages(r.data)).catch(() => {});
    api.get("/payments/currency-rates").then((r) => setRates(r.data)).catch(() => {});
  }, [plan]);

  useEffect(() => {
    if (tx?.status === "confirmed" && botId) {
      const timer = setTimeout(() => navigate(`/deployment?bot=${botId}&duration=${pkg.durationWeeks}`), 1200);
      return () => clearTimeout(timer);
    }
  }, [tx, botId, pkg, navigate]);

  const ready = method && pkg;

  // Converts the package's base-currency (USD) price into the selected display currency
  function displayPrice(p) {
    if (method?.key === "av_coins") return `${p.priceCoins} AV`;
    if (!rates?.rates) return `${p.priceUSD} USD`;
    const rate = rates.rates[currency] || 1;
    const converted = (p.priceUSD * rate).toFixed(currency === "USD" ? 2 : 0);
    return `${converted} ${currency}`;
  }

  async function handleContinue() {
    const { data } = await api.post("/payments/transactions", {
      plan, durationWeeks: pkg.durationWeeks, method: method.key, currency,
    });

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    setTx(data.transaction || data);
    if (data.instructions) setInstructions(data.instructions);
  }

  async function submitProof() {
    const { data } = await api.post(`/payments/transactions/${tx._id}/proof`, { proofReference: proofRef });
    setTx(data);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Heading as="h1" className="text-2xl text-center mb-8">Payment required</Heading>

      <Heading as="h2" className="text-lg text-center mb-4">Available Payment methods</Heading>
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {methods.map((m) => {
          const Icon = getIcon(m.icon);
          return (
            <button key={m._id} onClick={() => setMethod(m)}
              className={`card px-4 py-2 text-sm font-body flex items-center gap-2 ${method?._id === m._id ? "border-brand dark:border-brand-dark" : ""}`}>
              <Icon className="text-brand dark:text-brand-dark" size={16} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center mb-8">
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="card px-4 py-2 text-sm font-body bg-transparent">
          {Object.keys(rates?.rates || { USD: 1 }).map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <Heading as="h2" className="text-lg text-center mb-4">Available packages</Heading>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {packages.map((p) => (
          <button key={p._id} onClick={() => setPkg(p)}
            className={`card p-4 text-center font-body ${pkg?._id === p._id ? "border-brand dark:border-brand-dark" : ""}`}>
            <p className="text-sm">{p.durationWeeks} weeks</p>
            <p className="text-xs text-muted dark:text-muted-dark mt-1">{displayPrice(p)}</p>
          </button>
        ))}
      </div>

      {!tx && (
        <button disabled={!ready} onClick={handleContinue} className="btn-primary w-full disabled:opacity-40">Continue</button>
      )}

      {tx && (
        <div className="card p-4 mt-6 text-sm font-body">
          {tx.status === "confirmed" && (
            <p className="text-brand dark:text-brand-dark">Payment confirmed! Redirecting to deployment...</p>
          )}

          {tx.status === "pending" && method?.key === "manual" && (
            <div className="space-y-3">
              <p>Send payment to one of the numbers below, then submit your transaction reference.</p>
              {instructions ? (
                <div className="space-y-2">
                  {instructions.numbers?.map((n, i) => (
                    <div key={i} className="card p-0 overflow-hidden flex items-stretch text-xs font-body">
                      <div className="flex-1 flex divide-x divide-border dark:divide-border-dark">
                        <span className="flex-1 px-3 py-2.5 truncate">{n.number}</span>
                        <span className="px-3 py-2.5 text-muted dark:text-muted-dark truncate">{n.network}</span>
                        <span className="px-3 py-2.5 text-muted dark:text-muted-dark truncate">{n.name}</span>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(n.number)}
                        className="px-3 py-2.5 bg-brand/10 dark:bg-brand-dark/10 text-brand dark:text-brand-dark font-medium shrink-0"
                      >
                        Copy number
                      </button>
                    </div>
                  ))}
                  {!instructions.numbers?.length && (
                    <p className="text-muted dark:text-muted-dark text-xs">
                      No payment numbers configured yet — set MANUAL_PAYMENT_NUMBERS in the backend env vars.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted dark:text-muted-dark">Loading payment details...</p>
              )}
              <input value={proofRef} onChange={(e) => setProofRef(e.target.value)} placeholder="Transaction reference"
                     className="w-full rounded-lg px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
              <button onClick={submitProof} className="btn-primary w-full text-sm">Submit for review</button>
            </div>
          )}

          {tx.status === "awaiting_admin_review" && (
            <p>Your payment proof was submitted and is awaiting admin confirmation. Check <b>My Payments</b> from your account for updates.</p>
          )}

          {tx.status === "pending" && method?.key === "paypal" && (
            <p>
              PayPal checkout — integrate the PayPal JS SDK buttons here using <code>VITE_PAYPAL_CLIENT_ID</code>,
              then POST the approved order id to <code>/api/payments/paypal/:orderId/capture</code>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
