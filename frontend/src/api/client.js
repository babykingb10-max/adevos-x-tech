import axios from "axios";

const TOKEN_KEY = "adevos_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // still send the cookie too, when the browser allows it
});

// Frontend (Vercel) and backend (Heroku) live on different domains, and many
// mobile browsers now block third-party/cross-site cookies by default — that
// cookie can silently stop being sent on refresh, which looks exactly like
// "gets logged out every time I reload the page". Storing the JWT in
// localStorage and sending it as a normal Authorization header sidesteps
// browser cookie policy entirely, since it isn't a cookie at all.
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common["Authorization"];
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Re-apply the saved token (if any) as soon as this module loads, so the very
// first request made anywhere in the app (even before AuthContext mounts)
// already carries it.
const existingToken = getStoredToken();
if (existingToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${existingToken}`;
}

export default api;
