import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminSupport() {
  const [form, setForm] = useState({ description: "", communityUrl: "", whatsappUrl: "", telegramUrl: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/support").then((r) => r.data && setForm((f) => ({ ...f, ...r.data }))).catch(() => {});
  }, []);

  async function save(e) {
    e.preventDefault();
    await api.put("/support", form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h2 className="heading text-xl mb-4">Support</h2>
      <form onSubmit={save} className="space-y-3 max-w-lg">
        <div>
          <label className="text-xs text-muted-dark font-body block mb-1">Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                     className="w-full rounded-lg px-3 py-2 bg-surface-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-dark font-body block mb-1">Community link (Telegram group/channel)</label>
          <input value={form.communityUrl} onChange={(e) => setForm({ ...form, communityUrl: e.target.value })}
                 className="w-full rounded-lg px-3 py-2 bg-surface-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-dark font-body block mb-1">WhatsApp link</label>
          <input value={form.whatsappUrl} onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
                 className="w-full rounded-lg px-3 py-2 bg-surface-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-dark font-body block mb-1">Telegram link</label>
          <input value={form.telegramUrl} onChange={(e) => setForm({ ...form, telegramUrl: e.target.value })}
                 className="w-full rounded-lg px-3 py-2 bg-surface-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
        </div>
        <button type="submit" className="btn-primary">Save</button>
        {saved && <span className="text-brand-dark text-sm font-body ml-3">Saved!</span>}
      </form>
    </div>
  );
}
