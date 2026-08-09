import { useEffect, useState } from "react";
import api from "../../api/client";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { useContentRefresh } from "../../context/SocketContext";

export default function UpdatesPopup({ onClose }) {
  const [updates, setUpdates] = useState([]);
  const { user } = useAuth();
  const refresh = useContentRefresh("updates");

  useEffect(() => { api.get("/updates").then((r) => setUpdates(r.data)).catch(() => {}); }, [refresh]);

  async function markOneRead(id) {
    if (user) await api.post(`/updates/${id}/read`);
    setUpdates((prev) => prev.map((u) => (u._id === id ? { ...u, read: true } : u)));
  }

  async function markAllRead() {
    if (user) await api.post("/updates/mark-all-read");
    setUpdates((prev) => prev.map((u) => ({ ...u, read: true })));
  }

  const unreadCount = updates.filter((u) => !u.read).length;

  return (
    <Modal title="Updates" onClose={onClose}>
      <div className="space-y-3 mb-4">
        {updates.map((u) => (
          <button
            key={u._id}
            onClick={() => !u.read && markOneRead(u._id)}
            className={`w-full text-left card p-3 border ${
              u.read
                ? "opacity-50 border-border dark:border-border-dark"
                : "border-brand dark:border-brand-dark bg-brand/5 dark:bg-brand-dark/5"
            }`}
          >
            <div className="flex items-center gap-2">
              {!u.read && <span className="w-2 h-2 rounded-full bg-brand dark:bg-brand-dark shrink-0" />}
              <p className="font-display font-semibold text-brand dark:text-brand-dark text-sm">{u.heading}</p>
            </div>
            <p className="text-sm text-muted dark:text-muted-dark font-body mt-1">{u.description}</p>
          </button>
        ))}
        {!updates.length && <p className="text-sm text-muted dark:text-muted-dark font-body">No updates yet.</p>}
      </div>
      {user && unreadCount > 0 && (
        <button onClick={markAllRead} className="btn-primary w-full text-sm">Mark all as read</button>
      )}
    </Modal>
  );
}
