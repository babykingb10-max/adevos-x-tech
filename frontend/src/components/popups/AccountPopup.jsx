import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";
import Heading from "../ui/Heading";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { usePopup } from "../../context/PopupContext";

function formatRemaining(expiresAt) {
  const diffMs = new Date(expiresAt) - new Date();
  if (diffMs <= 0) return "Expired";
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${days} day${days !== 1 ? "s" : ""} remaining`;
}

// A centered section title above each group of rows (Plan / Theme / Account management).
function SectionTitle({ children }) {
  return <Heading as="h4" className="text-sm text-center mb-2">{children}</Heading>;
}

// A single row of up-to-three equal-width pill buttons — the shared visual
// pattern used for every row in this popup.
function ButtonRow({ children }) {
  return <div className="flex gap-2 mb-4">{children}</div>;
}
function RowButton({ active, disabled, onClick, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 text-xs px-2 py-2 rounded-lg font-body text-center truncate ${
        active ? "btn-primary" : "btn-outline"
      } ${disabled ? "opacity-60" : ""}`}
    >
      {children}
    </button>
  );
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

  const referralUrl = user.referralCode ? `${window.location.origin}/r/${user.referralCode}` : null;
  // Shows just enough of the link to recognize it, e.g. "adevos-x-tech..."
  const referralPreview = referralUrl ? referralUrl.replace(/^https?:\/\//, "").slice(0, 16) + "..." : null;

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

      {/* Plan */}
      <SectionTitle>Plan</SectionTitle>
      {planCategory === "none" ? (
        <ButtonRow>
          <RowButton disabled>No active plan</RowButton>
        </ButtonRow>
      ) : (
        <>
          <ButtonRow>
            <RowButton disabled>{planCategory === "deployer" ? "Deployer plan" : "User plan"}</RowButton>
            <RowButton active>Active</RowButton>
            <RowButton onClick={() => setStatusOpen(!statusOpen)}>Subscription status</RowButton>
          </ButtonRow>
          {statusOpen && (
            <div className="text-xs font-body text-muted dark:text-muted-dark space-y-1 mb-4 px-1">
              <p>Package: {user.activePackage.durationWeeks} weeks</p>
              <p>Paid via: {user.activePackage.paymentMethod}</p>
              <p>{formatRemaining(user.activePackage.expiresAt)}</p>
            </div>
          )}
        </>
      )}

      {/* Theme */}
      <SectionTitle>Theme</SectionTitle>
      <ButtonRow>
        {["system", "light", "dark"].map((m) => (
          <RowButton key={m} active={mode === m} onClick={() => setMode(m)}>
            {m[0].toUpperCase() + m.slice(1)}
          </RowButton>
        ))}
      </ButtonRow>

      {/* Account management (Referral + Actions) */}
      <SectionTitle>Account management</SectionTitle>

      {referralUrl ? (
        <ButtonRow>
          <RowButton disabled>{referralPreview}</RowButton>
          <RowButton onClick={() => navigator.clipboard.writeText(referralUrl)}>Copy</RowButton>
          <RowButton onClick={() => navigator.share?.({ url: referralUrl })}>Share</RowButton>
        </ButtonRow>
      ) : (
        <ButtonRow>
          <RowButton disabled>Referral Link</RowButton>
          <RowButton disabled>None</RowButton>
          <RowButton onClick={goGenerateReferral}>Generate</RowButton>
        </ButtonRow>
      )}

      <ButtonRow>
        <RowButton onClick={() => { onClose(); openPopup("my_payments"); }}>My payments</RowButton>
        {planCategory === "none" && (
          <RowButton active onClick={() => { onClose(); openPopup("plan_select"); }}>See available plans</RowButton>
        )}
        {planCategory === "user" && (
          <RowButton active onClick={() => { onClose(); navigate("/payment?plan=deployer"); }}>Upgrade to Deployer plan</RowButton>
        )}
        {planCategory === "deployer" && (
          <RowButton active onClick={() => { onClose(); navigate("/bots?plan=deployer"); }}>Deployer plan</RowButton>
        )}
        <RowButton onClick={handleLogout}>
          <span className="text-red-500">Logout</span>
        </RowButton>
      </ButtonRow>
    </Modal>
  );
}
