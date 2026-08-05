import { useEffect, useState } from "react";
import api from "../../api/client";

// Reusable admin panel for any endpoint built with the backend's crudRouter
// (hero-slides, services, in-touch, testimonials, stay-connected, footer-links,
// menu-items, tutorials, banners, plans, payment-methods, packages,
// deployment-platforms, deployment-music). `fields` describes the form inputs.
export default function AdminCrudSection({ title, endpoint, fields }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null = not editing, {} = new item, {...} = existing
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get(`${endpoint}/admin/all`);
    setItems(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, [endpoint]);

  async function save(e) {
    e.preventDefault();
    if (editing._id) await api.put(`${endpoint}/${editing._id}`, editing);
    else await api.post(endpoint, editing);
    setEditing(null);
    load();
  }

  async function toggleHide(id) { await api.patch(`${endpoint}/${id}/hide`); load(); }
  async function remove(id) { if (confirm("Delete this item?")) { await api.delete(`${endpoint}/${id}`); load(); } }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="heading text-xl">{title}</h2>
        <button onClick={() => setEditing(Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""])))} className="btn-primary text-xs">
          Add
        </button>
      </div>

      {loading ? (
        <p className="text-muted-dark font-body text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="card bg-surface-dark border-border-dark p-3 flex justify-between items-center">
              <div className="text-sm font-body text-text-dark">
                {fields[0] && (typeof item[fields[0].key] === "string" ? item[fields[0].key] : JSON.stringify(item[fields[0].key]))}
                {item.isHidden && <span className="text-xs text-muted-dark ml-2">(hidden)</span>}
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setEditing(item)} className="btn-outline">Edit</button>
                <button onClick={() => toggleHide(item._id)} className="btn-outline">{item.isHidden ? "Show" : "Hide"}</button>
                <button onClick={() => remove(item._id)} className="btn-outline text-red-400 border-red-400">Delete</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-muted-dark font-body text-sm">No items yet — click Add to create the first one.</p>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="card bg-surface-dark border-border-dark p-6 w-full max-w-md space-y-3">
            <h3 className="heading text-lg mb-2">{editing._id ? "Edit" : "Add"} {title}</h3>
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-dark font-body block mb-1">{f.label}</label>
                <input
                  value={editing[f.key] ?? ""}
                  onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none"
                />
              </div>
            ))}
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
