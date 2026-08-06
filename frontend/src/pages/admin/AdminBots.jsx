import { useEffect, useState } from "react";
import api from "../../api/client";

const empty = () => ({
  name: "", slug: "", description: "", author: "Adevos", imageUrl: "",
  isFree: false, freeWebsiteUrl: "", githubRepoUrl: "", pairSiteUrl: "",
  badge: "none", availableForPlans: ["user", "deployer"],
  ratingAverage: 0, ratingCount: 0,
});

export default function AdminBots() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() { const { data } = await api.get("/bots/admin/all"); setItems(data); }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    if (editing._id) await api.put(`/bots/${editing._id}`, editing);
    else await api.post("/bots", editing);
    setEditing(null);
    load();
  }
  async function toggleHide(id) { await api.patch(`/bots/${id}/hide`); load(); }
  async function remove(id) { if (confirm("Delete this bot?")) { await api.delete(`/bots/${id}`); load(); } }
  function togglePlan(plan) {
    const set = new Set(editing.availableForPlans || []);
    set.has(plan) ? set.delete(plan) : set.add(plan);
    setEditing({ ...editing, availableForPlans: [...set] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="heading text-xl">Bots</h2>
        <button onClick={() => setEditing(empty())} className="btn-primary text-xs">Add</button>
      </div>

      <div className="space-y-2">
        {items.map((b) => (
          <div key={b._id} className="card bg-surface-dark border-border-dark p-3 flex justify-between items-center flex-wrap gap-2">
            <div className="text-sm font-body text-text-dark">
              {b.name} {b.isFree && <span className="text-xs text-brand-dark">(free)</span>}
              {b.isHidden && <span className="text-xs text-muted-dark ml-2">(hidden)</span>}
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setEditing(b)} className="btn-outline">Edit</button>
              <button onClick={() => toggleHide(b._id)} className="btn-outline">{b.isHidden ? "Show" : "Hide"}</button>
              <button onClick={() => remove(b._id)} className="btn-outline text-red-400 border-red-400">Delete</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-muted-dark font-body text-sm">No bots yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={save} className="card bg-surface-dark border-border-dark p-6 w-full max-w-md space-y-3 my-8">
            <h3 className="heading text-lg mb-2">{editing._id ? "Edit" : "Add"} Bot</h3>

            <label className="text-xs text-muted-dark font-body block mb-1">Name</label>
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="text-xs text-muted-dark font-body block mb-1">Slug (used for the app name)</label>
            <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="text-xs text-muted-dark font-body block mb-1">Description</label>
            <textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="text-xs text-muted-dark font-body block mb-1">Author</label>
            <input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="text-xs text-muted-dark font-body block mb-1">Image URL</label>
            <input value={editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <label className="flex items-center gap-2 text-sm font-body text-text-dark">
              <input type="checkbox" checked={editing.isFree} onChange={(e) => setEditing({ ...editing, isFree: e.target.checked })} />
              This is a free bot (no cost)
            </label>

            {editing.isFree ? (
              <>
                <label className="text-xs text-muted-dark font-body block mb-1">Website URL (for "Visit website")</label>
                <input value={editing.freeWebsiteUrl} onChange={(e) => setEditing({ ...editing, freeWebsiteUrl: e.target.value })}
                       className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
              </>
            ) : (
              <>
                <label className="text-xs text-muted-dark font-body block mb-1">GitHub repo URL</label>
                <input value={editing.githubRepoUrl} onChange={(e) => setEditing({ ...editing, githubRepoUrl: e.target.value })}
                       className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
                <label className="text-xs text-muted-dark font-body block mb-1">Pair site URL</label>
                <input value={editing.pairSiteUrl} onChange={(e) => setEditing({ ...editing, pairSiteUrl: e.target.value })}
                       className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
              </>
            )}

            <label className="text-xs text-muted-dark font-body block mb-1">Available for plans</label>
            <div className="flex gap-4 text-sm font-body text-text-dark mb-1">
              <label className="flex items-center gap-1"><input type="checkbox" checked={editing.availableForPlans?.includes("user")} onChange={() => togglePlan("user")} /> User</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={editing.availableForPlans?.includes("deployer")} onChange={() => togglePlan("deployer")} /> Deployer</label>
            </div>

            <label className="text-xs text-muted-dark font-body block mb-1">Badge</label>
            <select value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none">
              <option value="none">None</option>
              <option value="popular">Popular</option>
              <option value="new">New</option>
              <option value="beta">Beta</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-dark font-body block mb-1">Rating average</label>
                <input type="number" step="0.1" min="0" max="5" value={editing.ratingAverage}
                       onChange={(e) => setEditing({ ...editing, ratingAverage: Number(e.target.value) })}
                       className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-dark font-body block mb-1">Rating count</label>
                <input type="number" min="0" value={editing.ratingCount}
                       onChange={(e) => setEditing({ ...editing, ratingCount: Number(e.target.value) })}
                       className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
              </div>
            </div>

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
