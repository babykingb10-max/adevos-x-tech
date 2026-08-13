import { useEffect, useState } from "react";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import { useAuth } from "../context/AuthContext";

export default function AVCoins() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const { user } = useAuth();

  async function load() {
    const [me, hist] = await Promise.all([
      api.get("/av-coins/me"),
      api.get("/av-coins/referral-history"),
    ]);
    setData(me.data);
    setHistory(hist.data);
  }
  useEffect(() => { load(); }, []);

  async function generateReferral() {
    await api.post("/av-coins/generate-referral", { name: user?.name });
    load();
  }

  const referralUrl = data?.referralCode ? `${window.location.origin}/r/${data.referralCode}` : null;

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
        {referralUrl ? (
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark overflow-x-auto whitespace-nowrap">
              <span className="text-sm font-body text-brand dark:text-brand-dark">{referralUrl}</span>
            </div>
            <button onClick={() => navigator.clipboard.writeText(referralUrl)} className="text-xs px-3 py-1.5 rounded-lg btn-outline shrink-0">Copy</button>
            <button onClick={() => navigator.share?.({ url: referralUrl })} className="text-xs px-3 py-1.5 rounded-lg btn-outline shrink-0">Share</button>
          </div>
        ) : (
          <button onClick={generateReferral} className="text-sm px-4 py-2 rounded-lg btn-primary">Generate</button>
        )}
      </div>
    </div>
  );
}
