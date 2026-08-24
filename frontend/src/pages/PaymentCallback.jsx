import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import Heading from "../components/ui/Heading";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) { setStatus("failed"); return; }

    api.get(`/payments/verify-paystack/${reference}`)
      .then((r) => {
        setStatus(r.data.status);
        if (r.data.status === "confirmed") {
          setTimeout(() => navigate(`/bots?plan=${r.data.plan}`), 1500);
        }
      })
      .catch(() => setStatus("failed"));
  }, [params, navigate]);

  return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <Heading as="h1" className="text-xl mb-4">
        {status === "checking" && "Confirming your payment..."}
        {status === "confirmed" && "Payment confirmed!"}
        {status === "pending" && "Still processing..."}
        {status === "failed" && "Payment not completed"}
      </Heading>
      <p className="text-sm text-muted dark:text-muted-dark font-body mb-6">
        {status === "confirmed" && "Redirecting you to deploy your bot..."}
        {status === "pending" && "This can take a minute — check My Payments shortly."}
        {status === "failed" && "If you were charged, contact support with your reference number."}
      </p>
      {status !== "checking" && status !== "confirmed" && (
        <button onClick={() => navigate("/")} className="btn-outline text-sm">Back to home</button>
      )}
    </div>
  );
}