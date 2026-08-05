import { useEffect, useRef } from "react";

// Loads Google Identity Services and renders the official "Continue with Google"
// button. Calls onCredential(idToken) when the user completes sign-in — the
// caller is responsible for POSTing that token to /auth/google or /auth/admin/google.
export default function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return; // silently no-op until the key is configured

    function init() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 320,
      });
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    }
  }, [onCredential]);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return (
      <button type="button" disabled className="btn-outline w-full opacity-50" title="Set VITE_GOOGLE_CLIENT_ID to enable">
        Continue with Google (not configured)
      </button>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}
