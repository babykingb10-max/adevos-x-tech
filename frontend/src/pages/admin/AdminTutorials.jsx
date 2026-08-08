import { useEffect, useState } from "react";
import api from "../../api/client";
import { ICON_OPTIONS } from "../../lib/icons";
import { useConfirm } from "../../context/ConfirmContext";

const empty = () => ({ title: "", description: "", icon: "graduation-cap", videoUrl: "", youtubeUrl: "" });

export default function AdminTutorials() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const confirm = useConfirm();

  async function load() { const { data } = await api.get("/tutorials/admin/all"); setItems(data); }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    if (editing._id) await api.put(`/tutorials/${editing._id}`, editing);
    else await api.post("/tutorials", editing);
    setEditing(null);
    load();
  }
  async function toggleHide(id) { await api.patch(`/tutorials/${id}/hide`); load(); }
  async function remove(id) {
    if (await confirm("Delete this tutorial? This cannot be undone.")) {
      await api.delete(`/tutorials/${id}`);
      load();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <h2 className="heading text-xl">Tutorials</h2>
        <button onClick={() => setEditing(empty())} className="btn-primary text-xs">Add</button>
      </div>

      <div className="space-y-2">
        {items.map((t) => (
          <div key={t._id} className="card bg-surface-dark border-border-dark p-3 flex justify-between items-center flex-wrap gap-2">
            <div className="text-sm font-body text-text-dark">
              {t.title} {t.isHidden && <span className="text-xs text-muted-dark ml-2">(hidden)</span>}
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setEditing(t)} className="btn-outline">Edit</button>
              <button onClick={() => toggleHide(t._id)} className="btn-outline">{t.isHidden ? "Show" : "Hide"}</button>
              <button onClick={() => remove(t._id)} className="btn-outline text-red-400 border-red-400">Delete</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-muted-dark font-body text-sm">No tutorials yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={save} className="card bg-surface-dark border-border-dark p-6 w-full max-w-md space-y-3 my-8">
            <h3 className="heading text-lg mb-2">{editing._id ? "Edit" : "Add"} Tutorial</h3>

            <label className="text-xs text-muted-dark font-body block mb-1">Heading</label>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="text-xs text-muted-dark font-body block mb-1">Icon</label>
            <select value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none">
              {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <label className="text-xs text-muted-dark font-body block mb-1">Description</label>
            <textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="text-xs text-muted-dark font-body block mb-1">Video URL (direct .mp4 file, plays inline)</label>
            <input value={editing.videoUrl} onChange={(e) => setEditing({ ...editing, videoUrl: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="text-xs text-muted-dark font-body block mb-1">YouTube URL (used instead, if set)</label>
            <input value={editing.youtubeUrl} onChange={(e) => setEditing({ ...editing, youtubeUrl: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
