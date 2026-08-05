import { useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import Heading from "../ui/Heading";
import HamburgerMenu from "../menu/HamburgerMenu";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-bg/90 dark:bg-bg-dark/90 backdrop-blur border-b border-border dark:border-border-dark">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="text-brand dark:text-brand-dark">
          <Menu size={26} />
        </button>

        <Heading as="span" className="text-lg">Adevos-X Tech</Heading>

        <Link to={user ? "/account" : "/sign-in"} aria-label="Account">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-brand dark:border-brand-dark" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand/10 dark:bg-brand-dark/10 flex items-center justify-center text-brand dark:text-brand-dark font-display font-semibold text-sm">
              {user ? user.name?.[0]?.toUpperCase() || "U" : "?"}
            </div>
          )}
        </Link>
      </div>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMenuOpen(false)} />
      )}
    </header>
  );
}
