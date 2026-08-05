import { useEffect, useState } from "react";
import api from "../../api/client";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";

export default function UpdatesPopup({ onClose }) {
  const [updates, setUpdates] = useState([]);
  const { user } = useAuth();

  useEffect(() => { api.get("/updates").then((r) => setUpdates(r.data)).catch(() => {}); }, []);

  async function markAllRead() {
    if (user) await api.post("/updates/mark-all-read");
    setUpdates((prev) => prev.map((u) => ({ ...u, read: true })));
  }

  return (
    <Modal title="Updates" onClose={onClose}>
      <div className="space-y-3 mb-4">
        {updates.map((u) => (
          <div key={u._id} className={`card p-3 ${u.read ? "opacity-60" : ""}`}>
            <p className="font-display font-semibold text-brand dark:text-brand-dark text-sm">{u.heading}</p>
            <p className="text-sm text-muted dark:text-muted-dark font-body mt-1">{u.description}</p>
          </div>
        ))}
        {!updates.length && <p className="text-sm text-muted dark:text-muted-dark font-body">No updates yet.</p>}
      </div>
      {user && <button onClick={markAllRead} className="btn-primary w-full text-sm">Mark as read</button>}
    </Modal>
  );
}
