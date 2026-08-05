import { useState } from "react";
import api from "../../api/client";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { key: "bug", label: "Report a bug" },
  { key: "feature_request", label: "Feature request" },
  { key: "general", label: "General opinion" },
];

export default function FeedbackPopup({ onClose, defaultCategory }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    category: defaultCategory || "general",
    message: "",
    name: user?.name || "",
    email: user?.email || "",
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/feedback", form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  }

  if (sent) {
    return (
      <Modal title="Thank you" onClose={onClose}>
        <p className="text-sm font-body text-text dark:text-text-dark">
          Your feedback has been submitted. We'll follow up by email if needed.
        </p>
        <button onClick={onClose} className="btn-primary w-full mt-4 text-sm">Close</button>
      </Modal>
    );
  }

  return (
    <Modal title="Send your response" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c.key} type="button" onClick={() => setForm({ ...form, category: c.key })}
              className={`btn text-xs ${form.category === c.key ? "btn-primary" : "btn-outline"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <textarea required placeholder="Your message" rows={4} value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
        <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
               className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
        <input required type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
               className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
        {error && <p className="text-red-500 text-sm font-body">{error}</p>}
        <button type="submit" className="btn-primary w-full text-sm">Submit</button>
      </form>
    </Modal>
  );
}
