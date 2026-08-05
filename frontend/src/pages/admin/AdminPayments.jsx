import { useEffect, useState } from "react";
import api from "../../api/client";
import AdminCrudSection from "../../components/admin/AdminCrudSection";

export default function AdminPayments() {
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("pending"); // "pending" | "methods" | "packages"

  async function load() { const { data } = await api.get("/payments/admin/pending"); setPending(data); }
  useEffect(() => { if (tab === "pending") load(); }, [tab]);

  async function confirm(id) { await api.patch(`/payments/admin/transactions/${id}/confirm`); load(); }
  async function cancel(id) { await api.patch(`/payments/admin/transactions/${id}/cancel`); load(); }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["pending", "methods", "packages"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn text-xs ${tab === t ? "btn-primary" : "btn-outline"}`}>
            {t === "pending" ? "Pending payments" : t === "methods" ? "Payment methods" : "Packages"}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div>
          <h2 className="heading text-xl mb-4">Pending payments</h2>
          <div className="space-y-2">
            {pending.map((tx) => (
              <div key={tx._id} className="card bg-surface-dark border-border-dark p-3 flex justify-between items-center text-sm font-body">
                <div>
                  <p>{tx.user?.name} ({tx.user?.email})</p>
                  <p className="text-muted-dark text-xs">{tx.plan} · {tx.durationWeeks} weeks · {tx.amount} {tx.currency} · {tx.method}</p>
                  {tx.proofReference && <p className="text-xs text-brand-dark">Ref: {tx.proofReference}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => confirm(tx._id)} className="btn-primary text-xs">Confirm</button>
                  <button onClick={() => cancel(tx._id)} className="btn-outline text-xs text-red-400 border-red-400">Cancel</button>
                </div>
              </div>
            ))}
            {!pending.length && <p className="text-muted-dark text-sm font-body">No pending payments.</p>}
          </div>
        </div>
      )}

      {tab === "methods" && (
        <AdminCrudSection title="Payment methods" endpoint="/payment-methods"
          fields={[{ key: "key", label: "Key (av_coins/manual/paystack/paypal)" }, { key: "label", label: "Label" }, { key: "icon", label: "Icon key" }]} />
      )}

      {tab === "packages" && (
        <AdminCrudSection title="Packages" endpoint="/packages"
          fields={[{ key: "plan", label: "Plan (user/deployer)" }, { key: "durationWeeks", label: "Duration weeks (2/4/8)" },
                   { key: "priceCoins", label: "Price in AV Coins (user plan only)" }, { key: "priceUSD", label: "Price in USD" }]} />
      )}
    </div>
  );
}
