import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUp } from "lucide-react";

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on the homepage / admin dashboard root — nothing to go "back" to.
  if (location.pathname === "/" || location.pathname === "/admin" || location.pathname === "/admin/") return null;

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className="fixed top-20 left-4 z-30 w-10 h-10 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow flex items-center justify-center text-brand dark:text-brand-dark"
    >
      <ArrowLeft size={18} />
    </button>
  );
}

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-4 z-30 w-10 h-10 rounded-full bg-brand dark:bg-brand-dark text-white dark:text-bg-dark shadow-lg flex items-center justify-center"
    >
      <ArrowUp size={18} />
    </button>
  );
}
