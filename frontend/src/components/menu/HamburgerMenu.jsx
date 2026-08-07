import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, ChevronDown } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { usePopup } from "../../context/PopupContext";
import { getIcon } from "../../lib/icons";
import { resolveSmartDeploy } from "../../lib/smartDeploy";

// NOTE: This panel is deliberately styled with fixed, always-dark colors
// (bg-[#0d1512], text-white, etc.) instead of the app's custom light/dark
// theme tokens. This guarantees the menu is always readable regardless of
// the site's current theme mode or any Tailwind build/purge quirk.
export default function HamburgerMenu({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [openKey, setOpenKey] = useState(null);
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const { user } = useAuth();
  const { open: openPopup } = usePopup();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/menu-items")
      .then((res) => setItems(res.data))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (!user) return setUnread(0);
    api.get("/updates/unread-count").then((res) => setUnread(res.data.unread)).catch(() => {});
  }, [user, open]);

  async function goTo(destination) {
    if (!destination) return;
    onClose();
    if (destination === "smart:deploy") {
      await resolveSmartDeploy({ user, navigate, openPopup });
    } else if (destination.startsWith("popup:")) {
      openPopup(destination);
    } else if (destination.startsWith("tutorial:")) {
      openPopup("tutorials");
    } else if (destination.startsWith("#")) {
      navigate("/");
      setTimeout(() => document.querySelector(destination)?.scrollIntoView({ behavior: "smooth" }), 300);
    } else {
      navigate(destination);
    }
  }

  const filtered = items.filter((i) => i.label?.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}

      <div
        className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-[#0d1512] border-r border-white/10 z-50 transform transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={onClose} aria-label="Close menu" className="text-emerald-400">
            <X />
          </button>
        </div>

        <div className="px-4 pb-8">
          <div className="flex items-center gap-2 border border-white/20 rounded-full px-4 py-2 mb-4">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bar..."
              className="bg-transparent outline-none text-sm w-full text-white placeholder-gray-500"
            />
          </div>

          {loadError && (
            <p className="text-red-400 text-sm mb-4">
              Could not load the menu. Check your connection and try again.
            </p>
          )}
          {!loadError && !items.length && (
            <p className="text-gray-400 text-sm mb-4">Loading menu...</p>
          )}

          <nav className="space-y-1">
            {filtered.map((item) => {
              const Icon = getIcon(item.icon);
              const hasSub = item.subItems?.length > 0;
              const isOpen = openKey === item._id;
              const isUpdatesItem = item.label === "Updates";
              const showBadge = isUpdatesItem && unread > 0;

              return (
                <div key={item._id}>
                  <button
                    onClick={() => (hasSub ? setOpenKey(isOpen ? null : item._id) : goTo(item.destination))}
                    className="w-full flex items-center justify-between py-3"
                  >
                    <span className={`flex items-center gap-3 text-base ${showBadge ? "text-emerald-400 font-semibold" : "text-white"}`}>
                      <Icon className="text-emerald-400 shrink-0" size={20} />
                      {item.label}
                    </span>
                    {hasSub && (
                      <ChevronDown size={16} className={`transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""}`} />
                    )}
                  </button>

                  {hasSub && isOpen && (
                    <div className="pl-9 pb-2 space-y-1">
                      {item.subItems.map((sub, idx) => {
                        const isLatestNews = isUpdatesItem && /latest news/i.test(sub.label);
                        return (
                          <button
                            key={idx}
                            onClick={() => goTo(sub.destination)}
                            className="flex items-center gap-2 text-sm py-1.5 w-full text-left text-gray-300"
                          >
                            <span>{sub.label}</span>
                            {isLatestNews && unread > 0 && (
                              <span className="text-xs bg-emerald-400 text-black rounded-full px-2 py-0.5">
                                {unread}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}