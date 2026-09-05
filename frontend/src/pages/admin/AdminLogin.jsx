import { useState } from "react";
import api from "../../api/client";
import GoogleSignInButton from "../../components/ui/GoogleSignInButton";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin({ onSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const { loginWithToken } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/admin/login", form);
      loginWithToken(data.token);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  async function handleGoogleCredential(idToken) {
    setError("");
    try {
      const { data } = await api.post("/auth/admin/google", { idToken });
      loginWithToken(data.token);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Admin Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="w-full max-w-sm card p-8 bg-surface-dark border-border-dark">
        <h1 className="heading text-2xl text-center mb-6">Adevos-X Tech Admin</h1>

        <form onSubmit={handleSubmit}>
          <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                 className="w-full rounded-full px-4 py-2 mb-3 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                 className="w-full rounded-full px-4 py-2 mb-4 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
          {error && <p className="text-red-400 text-sm font-body mb-3">{error}</p>}
          <button type="submit" className="btn-primary w-full mb-4">Log in</button>
        </form>

        <p className="text-center text-xs text-muted-dark font-body mb-3">or</p>
        <GoogleSignInButton onCredential={handleGoogleCredential} />
        <p className="text-center text-[10px] text-muted-dark font-body mt-4">
          Only Google accounts listed in ADMIN_ALLOWED_GOOGLE_EMAILS can sign in this way.
        </p>
      </div>
    </div>
  );
}
