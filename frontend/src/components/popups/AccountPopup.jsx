import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import api from "../../api/client";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { usePopup } from "../../context/PopupContext";

function formatRemaining(expiresAt) {
  const diffMs = new Date(expiresAt) - new Date();
  if (diffMs <= 0) return "Expired";
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${days} day${days !== 1 ? "s" : ""} remaining`;
}

export default function AccountPopup({ onClose }) {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const { open: openPopup } = usePopup();
  const [statusOpen, setStatusOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const hasValidPackage =
    user.activePackage?.expiresAt && new Date(user.activePackage.expiresAt) > new Date();
  const planCategory = !hasValidPackage ? "none" : user.plan; // "none" | "user" | "deployer"

  function goGenerateReferral() {
    onClose();
    navigate("/av-coins");
  }

  async function handleLogout() {
    await logout();
    onClose();
  }

  return (
    <Modal title="Account" onClose={onClose}>
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-brand/10 dark:bg-brand-dark/10 flex items-center justify-center text-brand dark:text-brand-dark font-display text-xl mb-2">
          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : user.name?.[0]?.toUpperCase()}
        </div>
        <p className="text-muted dark:text-muted-dark font-body text-sm">{user.email}</p>
      </div>

      {/* Plan category card */}
      <div className="card p-3 mb-4">
        {planCategory === "none" && (
          <p className="text-sm font-body text-center text-muted dark:text-muted-dark">No active plan</p>
        )}
        {planCategory !== "none" && (
          <div>
            <button onClick={() => setStatusOpen(!statusOpen)} className="w-full flex items-center justify-between text-sm font-body">
              <span className="capitalize">{planCategory} plan — active</span>
              <ChevronDown size={16} className={`transition-transform ${statusOpen ? "rotate-180" : ""}`} />
            </button>
            {statusOpen && (
              <div className="mt-2 pt-2 border-t border-border dark:border-border-dark text-xs font-body text-muted dark:text-muted-dark space-y-1">
                <p>Package: {user.activePackage.durationWeeks} weeks</p>
                <p>Paid via: {user.activePackage.paymentMethod}</p>
                <p>{formatRemaining(user.activePackage.expiresAt)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <p className="text-sm font-body font-semibold mb-2">Settings</p>
      <div className="card p-3 mb-4">
        <p className="text-xs font-body text-muted dark:text-muted-dark mb-2">Theme</p>
        <div className="flex gap-2">
          {["system", "light", "dark"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`text-xs px-3 py-1 rounded-full font-body ${mode === m ? "btn-primary" : "btn-outline"}`}>
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Referral link */}
      <div className="card p-3 mb-4">
        {user.referralCode ? (
          <>
            <p className="text-xs font-body mb-1">Referral Link:</p>
            <p className="text-xs break-all text-brand dark:text-brand-dark font-body mb-2">
              {window.location.origin}/r/{user.referralCode}
            </p>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/r/${user.referralCode}`)} className="text-xs px-3 py-1 rounded-full btn-outline">Copy</button>
              <button onClick={() => navigator.share?.({ url: `${window.location.origin}/r/${user.referralCode}` })} className="text-xs px-3 py-1 rounded-full btn-outline">Share</button>
            </div>
          </>
        ) : (
          <button onClick={goGenerateReferral} className="text-xs px-3 py-1.5 rounded-full btn-primary">Generate referral link</button>
        )}
      </div>

      {/* Actions — kept small per feedback */}
      <div className="flex flex-col gap-2">
        <button onClick={() => { onClose(); openPopup("my_payments"); }} className="text-sm px-4 py-2 rounded-full btn-outline">
          My payments
        </button>

        {planCategory === "none" && (
          <button onClick={() => { onClose(); openPopup("plan_select"); }} className="text-sm px-4 py-2 rounded-full btn-primary">
            See available plans
          </button>
        )}
        {planCategory === "user" && (
          <button onClick={() => { onClose(); navigate("/payment?plan=deployer"); }} className="text-sm px-4 py-2 rounded-full btn-primary">
            Upgrade to Deployer plan
          </button>
        )}

        <button onClick={handleLogout} className="text-sm px-4 py-2 rounded-full btn-outline text-red-500 border-red-500">
          Logout
        </button>
      </div>
    </Modal>
  );
}
