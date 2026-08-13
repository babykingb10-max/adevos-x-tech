import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";

const STATUS_LABEL = {
  pending: "Pending",
  awaiting_admin_review: "Awaiting review",
  confirmed: "Confirmed",
  failed: "Cancelled",
  cancelled: "Cancelled",
};
const STATUS_COLOR = {
  pending: "text-yellow-500",
  awaiting_admin_review: "text-yellow-500",
  confirmed: "text-brand dark:text-brand-dark",
  failed: "text-red-500",
  cancelled: "text-red-500",
};

export default function MyPaymentsPopup({ onClose }) {
  const [transactions, setTransactions] = useState([]);
  const { refetch } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/payments/transactions/mine").then((r) => setTransactions(r.data)).catch(() => {});
  }, []);

  async function handleContinue(tx) {
    await refetch(); // pull the now-updated plan/activePackage onto the user object
    onClose();
    navigate("/bots?plan=" + tx.plan);
  }

  return (
    <Modal title="My Payments" onClose={onClose}>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div key={tx._id} className="card p-3 text-sm font-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="capitalize">{tx.plan} plan · {tx.durationWeeks} weeks</p>
                <p className="text-xs text-muted dark:text-muted-dark">{tx.amount} {tx.currency} · {tx.method}</p>
              </div>
              <span className={`text-xs font-semibold ${STATUS_COLOR[tx.status]}`}>{STATUS_LABEL[tx.status]}</span>
            </div>
            {tx.status === "confirmed" && (
              <button onClick={() => handleContinue(tx)} className="mt-2 text-xs px-3 py-1 rounded-lg btn-primary">
                Continue to deployment
              </button>
            )}
            {(tx.status === "pending" || tx.status === "awaiting_admin_review") && (
              <p className="text-xs text-muted dark:text-muted-dark mt-1">
                Your payment is being reviewed — check back shortly.
              </p>
            )}
          </div>
        ))}
        {!transactions.length && (
          <p className="text-sm text-muted dark:text-muted-dark font-body text-center">No payments yet.</p>
        )}
      </div>
    </Modal>
  );
}
