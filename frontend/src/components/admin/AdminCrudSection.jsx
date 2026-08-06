import { useEffect, useState } from "react";
import api from "../../api/client";
import { ICON_OPTIONS, getIcon } from "../../lib/icons";
import { ALL_DESTINATIONS } from "../../lib/destinations";

// Reusable admin panel for any endpoint built with the backend's crudRouter.
// `fields` describes the form inputs. Each field: { key, label, type }
//   type: "text" (default) | "textarea" | "select" (needs `options`) | "icon"
export default function AdminCrudSection({ title, endpoint, fields }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
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
          {items.map((item) => {
            const iconField = fields.find((f) => f.type === "icon");
            const Icon = iconField ? getIcon(item[iconField.key]) : null;
            return (
              <div key={item._id} className="card bg-surface-dark border-border-dark p-3 flex justify-between items-center flex-wrap gap-2">
                <div className="text-sm font-body text-text-dark flex items-center gap-2">
                  {Icon && <Icon className="text-brand-dark shrink-0" size={16} />}
                  <span>
                    {fields[0] && (typeof item[fields[0].key] === "string" ? item[fields[0].key] : JSON.stringify(item[fields[0].key]))}
                    {item.isHidden && <span className="text-xs text-muted-dark ml-2">(hidden)</span>}
                  </span>
                </div>
                <div className="flex gap-2 text-xs shrink-0">
                  <button onClick={() => setEditing(item)} className="btn-outline">Edit</button>
                  <button onClick={() => toggleHide(item._id)} className="btn-outline">{item.isHidden ? "Show" : "Hide"}</button>
                  <button onClick={() => remove(item._id)} className="btn-outline text-red-400 border-red-400">Delete</button>
                </div>
              </div>
            );
          })}
          {!items.length && <p className="text-muted-dark font-body text-sm">No items yet — click Add to create the first one.</p>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={save} className="card bg-surface-dark border-border-dark p-6 w-full max-w-md space-y-3 my-8">
            <h3 className="heading text-lg mb-2">{editing._id ? "Edit" : "Add"} {title}</h3>
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-dark font-body block mb-1">{f.label}</label>

                {f.type === "textarea" && (
                  <textarea
                    rows={4}
                    value={editing[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none"
                  />
                )}

                {f.type === "select" && (
                  <select
                    value={editing[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none"
                  >
                    <option value="">Select...</option>
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {f.type === "icon" && (
                  <select
                    value={editing[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none"
                  >
                    <option value="">Select an icon...</option>
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}

                {f.type === "destination" && (
                  <DestinationField field={f} editing={editing} setEditing={setEditing} />
                )}

                {(!f.type || f.type === "text") && (
                  <input
                    value={editing[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none"
                  />
                )}
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

// Picks a destination: internal (dropdown of every known route/popup) or a
// raw external URL. Writes the chosen value into `field.key`, and — if
// `field.actionTypeKey` is provided — writes "internal"/"external" there too
// (matches HeroSlide.actionType).
function DestinationField({ field, editing, setEditing }) {
  const currentIsKnown = ALL_DESTINATIONS.some((d) => d.value === editing[field.key]);
  const [customMode, setCustomMode] = useState(!currentIsKnown && Boolean(editing[field.key]));

  function setTarget(value, isExternal) {
    const update = { ...editing, [field.key]: value };
    if (field.actionTypeKey) update[field.actionTypeKey] = isExternal ? "external" : "internal";
    setEditing(update);
  }

  return (
    <div>
      <div className="flex gap-3 mb-2 text-xs font-body">
        <label className="flex items-center gap-1">
          <input type="radio" checked={!customMode} onChange={() => setCustomMode(false)} />
          Choose from site
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={customMode} onChange={() => setCustomMode(true)} />
          External URL
        </label>
      </div>
      {customMode ? (
        <input
          placeholder="https://..."
          value={editing[field.key] ?? ""}
          onChange={(e) => setTarget(e.target.value, true)}
          className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none"
        />
      ) : (
        <select
          value={editing[field.key] ?? ""}
          onChange={(e) => setTarget(e.target.value, false)}
          className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none"
        >
          <option value="">Select a destination...</option>
          {ALL_DESTINATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
