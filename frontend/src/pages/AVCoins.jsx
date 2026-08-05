import { useEffect, useState } from "react";
import api from "../api/client";
import Heading from "../components/ui/Heading";

export default function AVCoins() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/av-coins/me").then((r) => setData(r.data)).catch(() => {});
    api.get("/av-coins/referral-history").then((r) => setHistory(r.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Heading as="h1" className="text-2xl text-center mb-2">Adevos Coins [AV]</Heading>
      <p className="text-center text-muted dark:text-muted-dark font-body mb-8">
        Earn AV Coins by referring new users. Use them to deploy bots under the User plan without paying cash.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-muted dark:text-muted-dark font-body">Available balance</p><p className="text-2xl font-display font-semibold text-brand dark:text-brand-dark">{data?.balance ?? "—"}</p></div>
        <div className="card p-4"><p className="text-xs text-muted dark:text-muted-dark font-body">Earned this month</p><p className="text-2xl font-display font-semibold text-brand dark:text-brand-dark">{data?.earnedThisMonth ?? "—"}</p></div>
        <div className="card p-4"><p className="text-xs text-muted dark:text-muted-dark font-body">Total referrals</p><p className="text-2xl font-display font-semibold text-brand dark:text-brand-dark">{data?.totalReferrals ?? "—"}</p></div>
        <div className="card p-4"><p className="text-xs text-muted dark:text-muted-dark font-body">Referral history</p><p className="text-2xl font-display font-semibold text-brand dark:text-brand-dark">{history.length}</p></div>
      </div>

      <Heading as="h2" className="text-lg mb-3">Your referral link</Heading>
      <div className="card p-4">
        {data?.referralCode ? (
          <p className="text-sm font-body text-brand dark:text-brand-dark break-all">
            {import.meta.env.VITE_API_URL?.replace("/api", "")}/r/{data.referralCode}
          </p>
        ) : (
          <p className="text-sm text-muted dark:text-muted-dark font-body">Generate your link from the Account page to start earning.</p>
        )}
      </div>
    </div>
  );
}
