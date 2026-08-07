import { useState } from "react";
import { Menu, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Heading from "../ui/Heading";
import HamburgerMenu from "../menu/HamburgerMenu";
import { useAuth } from "../../context/AuthContext";
import { usePopup } from "../../context/PopupContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const { open: openPopup } = usePopup();
  const navigate = useNavigate();

  function handleAvatarClick() {
    if (user) openPopup("account");
    else navigate("/sign-in");
  }

  return (
    // IMPORTANT: HamburgerMenu is rendered OUTSIDE the <header> below, as a
    // sibling via this Fragment — not as a child of it. <header> uses
    // backdrop-blur (backdrop-filter), and CSS spec says any element with
    // filter/backdrop-filter/transform becomes the "containing block" for
    // position:fixed descendants. If the menu were nested inside <header>,
    // its "fixed" panel would be clipped to the header's own small height
    // instead of covering the full screen — exactly the "menu cut off at
    // the top" bug. Keeping it as a sibling avoids that entirely.
    <>
      <header className="sticky top-0 z-40 bg-bg/90 dark:bg-bg-dark/90 backdrop-blur border-b border-border dark:border-border-dark">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="text-brand dark:text-brand-dark">
            <Menu size={26} />
          </button>

          <Heading as="span" className="text-lg">Adevos-X Tech</Heading>

          <button onClick={handleAvatarClick} aria-label="Account">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-brand dark:border-brand-dark" />
            ) : user ? (
              <div className="w-9 h-9 rounded-full bg-brand/10 dark:bg-brand-dark/10 flex items-center justify-center text-brand dark:text-brand-dark font-display font-semibold text-sm">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full border border-brand dark:border-brand-dark flex items-center justify-center text-brand dark:text-brand-dark">
                <UserRound size={18} />
              </div>
            )}
          </button>
        </div>
      </header>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}