import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAuthToken, getStoredToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Re-apply the token on every fresh page load / refresh BEFORE checking
    // who's logged in — this is the actual fix for "gets logged out on
    // refresh": we no longer rely on the browser having kept a cross-site
    // cookie around, we bring the token back ourselves from localStorage.
    const token = getStoredToken();
    if (token) setAuthToken(token);
    refetch();
  }, [refetch]);

  // Call this right after any successful login/register/OTP-verify/Google
  // sign-in response — it both persists the token and updates axios so every
  // subsequent request (including the /auth/me call right after) is authenticated.
  function loginWithToken(token) {
    setAuthToken(token);
  }

  async function logout() {
    try { await api.post("/auth/logout"); } catch { /* ignore network errors on logout */ }
    setAuthToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refetch, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
