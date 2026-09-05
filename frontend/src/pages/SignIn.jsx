import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import GoogleSignInButton from "../components/ui/GoogleSignInButton";
import { useAuth } from "../context/AuthContext";
import { usePopup } from "../context/PopupContext";

export default function SignIn() {
  const [params] = useSearchParams();
  const referralCode = params.get("r") || undefined;

  const [mode, setMode] = useState(referralCode ? "signup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [otpStage, setOtpStage] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const { refetch, loginWithToken } = useAuth();
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
      const { data } = await api.post("/auth/google", { idToken, referralCode });
      loginWithToken(data.token);
      await refetch();
      goHomeAndOpenAccount();
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      if (mode === "login") {
        const { data } = await api.post("/auth/login", form);
        loginWithToken(data.token);
        await refetch();
        goHomeAndOpenAccount();
      } else {
        await api.post("/auth/register", { ...form, referralCode });
        setOtpEmail(form.email);
        setOtpStage(true);
        setInfo("We sent a 6-digit code to your email — enter it below to finish creating your account.");
      }
    } catch (err) {
      if (err.response?.data?.pendingVerification) {
        setOtpEmail(err.response.data.email || form.email);
        setOtpStage(true);
        setInfo(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Something went wrong");
      }
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/verify-otp", { email: otpEmail, code: otpCode });
      loginWithToken(data.token);
      await refetch();
      goHomeAndOpenAccount();
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    }
  }

  async function handleResendOtp() {
    setError("");
    setInfo("");
    try {
      await api.post("/auth/resend-otp", { email: otpEmail });
      setInfo("A new code has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code");
    }
  }

  if (otpStage) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16">
        <Heading as="h1" className="text-2xl text-center mb-2">Verify your email</Heading>
        <p className="text-center text-muted dark:text-muted-dark font-body mb-8 text-sm">
          {info || `Enter the 6-digit code we sent to ${otpEmail}.`}
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <input
            inputMode="numeric" maxLength={6} placeholder="123456"
            value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg px-4 py-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-center text-2xl tracking-[0.5em] font-display outline-none"
          />
          {error && <p className="text-red-500 text-sm font-body text-center">{error}</p>}
          <button type="submit" disabled={otpCode.length !== 6} className="btn-primary w-full disabled:opacity-40">Verify</button>
        </form>

        <button onClick={handleResendOtp} className="text-sm text-brand dark:text-brand-dark font-body mt-4 w-full text-center">
          Resend code
        </button>
        <button onClick={() => setOtpStage(false)} className="text-sm text-muted dark:text-muted-dark font-body mt-2 w-full text-center">
          Back
        </button>
      </div>
    );
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

      {!referralCode && (
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-brand dark:text-brand-dark font-body mt-4 w-full text-center">
          {mode === "login" ? "Sign up if you don't have an account" : "Already have an account? Log in"}
        </button>
      )}
    </div>
  );
}
