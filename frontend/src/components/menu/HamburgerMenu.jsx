import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, ChevronDown } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { usePopup } from "../../context/PopupContext";
import { getIcon } from "../../lib/icons";
import { resolveSmartDeploy } from "../../lib/smartDeploy";

export default function HamburgerMenu({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [openKey, setOpenKey] = useState(null);
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);
  const { user } = useAuth();
  const { open: openPopup } = usePopup();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/menu-items").then((res) => setItems(res.data)).catch(() => {});
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

  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      <div
        style={{ backgroundColor: "var(--menu-bg, #131A17)" }}
        className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark z-50 transform transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={onClose} aria-label="Close menu" className="text-brand dark:text-brand-dark">
            <X />
          </button>
        </div>

        <div className="px-4 pb-8">
          <div className="flex items-center gap-2 border border-border dark:border-border-dark rounded-full px-4 py-2 mb-4">
            <Search size={16} className="text-muted dark:text-muted-dark shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bar..."
              className="bg-transparent outline-none text-sm font-body w-full text-text dark:text-text-dark"
            />
          </div>

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
                    className="w-full flex items-center justify-between py-3 font-body"
                  >
                    <span className={`flex items-center gap-3 ${showBadge ? "text-brand dark:text-brand-dark font-semibold" : "text-text dark:text-text-dark"}`}>
                      <Icon className="text-brand dark:text-brand-dark shrink-0" size={20} />
                      {item.label}
                    </span>
                    {hasSub && (
                      <ChevronDown size={16} className={`transition-transform text-muted dark:text-muted-dark ${isOpen ? "rotate-180" : ""}`} />
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
                            className="flex items-center gap-2 text-sm font-body py-1.5 w-full text-left text-muted dark:text-muted-dark"
                          >
                            <span>{sub.label}</span>
                            {isLatestNews && unread > 0 && (
                              <span className="text-xs bg-brand dark:bg-brand-dark text-white dark:text-bg-dark rounded-full px-2 py-0.5">
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
