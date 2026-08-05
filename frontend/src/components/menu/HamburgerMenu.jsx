import { useEffect, useState } from "react";
import { X, Search, ChevronDown, Home, Bell, CloudUpload, Coins, GraduationCap, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { usePopup } from "../../context/PopupContext";

// Maps the icon key stored in MongoDB to an actual lucide icon component.
const ICONS = {
  home: Home, bell: Bell, "cloud-upload": CloudUpload, coins: Coins,
  "graduation-cap": GraduationCap, "message-square": MessageSquare, "user-circle": UserCircle,
};

export default function HamburgerMenu({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [openKey, setOpenKey] = useState(null);
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);
  const { user } = useAuth();
  const { open: openPopup } = usePopup();
  const navigate = useNavigate();

  function goTo(destination) {
    if (!destination) return;
    if (destination.startsWith("popup:")) openPopup(destination);
    else if (destination.startsWith("tutorial:")) openPopup("tutorials"); // opens the list; specific-video deep link can be added later
    else navigate(destination);
    onClose();
  }

  useEffect(() => {
    api.get("/menu-items").then((res) => setItems(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get("/updates/unread-count").then((res) => setUnread(res.data.unread)).catch(() => {});
  }, [user]);

  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      className={`fixed inset-y-0 left-0 w-full max-w-sm bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark z-50 transform transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex justify-end p-4">
        <button onClick={onClose} aria-label="Close menu" className="text-brand dark:text-brand-dark">
          <X />
        </button>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-2 border border-border dark:border-border-dark rounded-full px-4 py-2 mb-4">
          <Search size={16} className="text-muted dark:text-muted-dark" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bar..."
            className="bg-transparent outline-none text-sm font-body w-full text-text dark:text-text-dark"
          />
        </div>

        <nav className="space-y-1">
          {filtered.map((item) => {
            const Icon = ICONS[item.icon] || Home;
            const hasSub = item.subItems?.length > 0;
            const isOpen = openKey === item._id;
            const showBadge = item.label === "Updates" && unread > 0;

            const Row = (
              <button
                onClick={() => (hasSub ? setOpenKey(isOpen ? null : item._id) : goTo(item.destination))}
                className="w-full flex items-center justify-between py-3 text-text dark:text-text-dark font-body"
              >
                <span className="flex items-center gap-3">
                  <Icon size={20} className="text-brand dark:text-brand-dark" />
                  {item.label}
                  {showBadge && (
                    <span className="text-xs bg-brand dark:bg-brand-dark text-white dark:text-bg-dark rounded-full px-2 py-0.5">
                      {unread}
                    </span>
                  )}
                </span>
                {hasSub && (
                  <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                )}
              </button>
            );

            return (
              <div key={item._id}>
                {Row}
                {hasSub && isOpen && (
                  <div className="pl-9 pb-2 space-y-2">
                    {item.subItems.map((sub, idx) => {
                      const SubIcon = ICONS[sub.icon] || Icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => goTo(sub.destination)}
                          className="flex items-center gap-2 text-sm text-muted dark:text-muted-dark font-body py-1 w-full text-left"
                        >
                          {sub.label}
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
  );
}
