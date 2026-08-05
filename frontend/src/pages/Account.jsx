import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Account() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [referral, setReferral] = useState(user?.referralCode || null);
  const navigate = useNavigate();

  if (!user) { navigate("/sign-in"); return null; }

  async function generateReferral() {
    const { data } = await api.post("/av-coins/generate-referral", { name: user.name });
    setReferral(data.referralCode);
  }

  const planLabel = {
    not_configured: "Plan not yet configured",
    user: "User plan",
    deployer: "Deployer plan",
  }[user.plan];

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-brand/10 dark:bg-brand-dark/10 flex items-center justify-center text-brand dark:text-brand-dark font-display text-2xl mb-3">
          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : user.name?.[0]?.toUpperCase()}
        </div>
        <Heading as="h1" className="text-2xl">Account</Heading>
        <p className="text-muted dark:text-muted-dark font-body text-sm mt-1">{user.email}</p>
        <p className="text-sm font-body mt-1">{planLabel}</p>
      </div>

      <Heading as="h2" className="text-lg mb-3">Settings</Heading>
      <div className="card p-4 mb-6">
        <p className="text-sm font-body mb-2">Theme</p>
        <div className="flex gap-2">
          {["system", "light", "dark"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`btn text-xs ${mode === m ? "btn-primary" : "btn-outline"}`}>
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 mb-6">
        {referral ? (
          <>
            <p className="text-sm font-body mb-2">Referral Link:</p>
            <p className="text-xs break-all text-brand dark:text-brand-dark font-body mb-2">
              {import.meta.env.VITE_API_URL?.replace("/api", "")}/r/{referral}
            </p>
            <button className="btn-outline text-xs mr-2">Copy</button>
            <button className="btn-outline text-xs">Share</button>
          </>
        ) : (
          <button onClick={generateReferral} className="btn-primary text-xs">Generate referral link</button>
        )}
      </div>

      {user.plan === "not_configured" && <button className="btn-primary w-full mb-3">See available plans</button>}
      {user.plan === "user" && <button className="btn-primary w-full mb-3">Upgrade to Deployer plan</button>}
      {user.plan === "deployer" && <button className="btn-outline w-full mb-3">Subscription status</button>}

      <button onClick={logout} className="btn-outline w-full text-red-500 border-red-500">Logout</button>
    </div>
  );
}
