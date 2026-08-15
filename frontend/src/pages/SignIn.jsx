import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import GoogleSignInButton from "../components/ui/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";
import { usePopup } from "../context/PopupContext";

export default function SignIn() {
  const [params] = useSearchParams();
  const referralCode = params.get("r") || undefined; // from a shared /r/:code link

  // Arriving via a referral link forces signup-only (no login toggle) —
  // the referrer only earns their bonus for genuinely NEW accounts.
  const [mode, setMode] = useState(referralCode ? "signup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { refetch } = useAuth();
  const { open: openPopup } = usePopup();
  const navigate = useNavigate();

  useEffect(() => {
    if (referralCode) setMode("signup");
  }, [referralCode]);

  function goHomeAndOpenAccount() {
    navigate("/");
    setTimeout(() => openPopup("account"), 200);
  }

  async function handleGoogleCredential(idToken) {
    try {
      await api.post("/auth/google", { idToken, referralCode });
      await refetch();
      goHomeAndOpenAccount();
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await api.post("/auth/login", form);
      } else {
        await api.post("/auth/register", { ...form, referralCode });
      }
      await refetch();
      goHomeAndOpenAccount();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <Heading as="h1" className="text-2xl text-center mb-2">Adevos-X Tech</Heading>
      <p className="text-center text-muted dark:text-muted-dark font-body mb-8">
        {referralCode
          ? "You've been invited to Adevos-X Tech — create your account to get started."
          : "To continue with Adevos-X Tech you have to sign in or create an account."}
      </p>

      <div className="mb-6"><GoogleSignInButton onCredential={handleGoogleCredential} /></div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <input placeholder="Username" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                 className="w-full rounded-lg px-4 py-2 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
        )}
        <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
               className="w-full rounded-lg px-4 py-2 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
        <input type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
               className="w-full rounded-lg px-4 py-2 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-sm font-body outline-none" />

        {error && <p className="text-red-500 text-sm font-body">{error}</p>}

        <button type="submit" className="btn-primary w-full">
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      {/* Referral links skip straight to signup — no login option, so a new
          account is always created for the referrer to be credited. */}
      {!referralCode && (
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-brand dark:text-brand-dark font-body mt-4 w-full text-center">
          {mode === "login" ? "Sign up if you don't have an account" : "Already have an account? Log in"}
        </button>
      )}
    </div>
  );
}
