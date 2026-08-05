import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function getSystemPref() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("theme_mode") || "system"); // "system" | "light" | "dark"

  const resolved = mode === "system" ? getSystemPref() : mode;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => document.documentElement.classList.toggle("dark", getSystemPref() === "dark");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [mode]);

  function updateMode(next) {
    setMode(next);
    localStorage.setItem("theme_mode", next);
    // NOTE: also PUT /api/users/me/profile { theme: next } when the user is logged in,
    // so the preference follows their account (see Settings page).
  }

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode: updateMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
