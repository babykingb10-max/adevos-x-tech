import { useEffect, useState } from "react";
import api from "../../api/client";

const emptyItem = () => ({ label: "", icon: "", destination: "", subItems: [], order: 0 });
const emptySub = () => ({ label: "", icon: "", destination: "", order: 0 });

export default function AdminMenuBuilder() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() { const { data } = await api.get("/menu-items/admin/all"); setItems(data); }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    if (editing._id) await api.put(`/menu-items/${editing._id}`, editing);
    else await api.post("/menu-items", editing);
    setEditing(null);
    load();
  }

  async function toggleHide(id) { await api.patch(`/menu-items/${id}/hide`); load(); }
  async function remove(id) { if (confirm("Delete this menu item?")) { await api.delete(`/menu-items/${id}`); load(); } }

  function updateSub(idx, field, value) {
    const subItems = [...editing.subItems];
    subItems[idx] = { ...subItems[idx], [field]: value };
    setEditing({ ...editing, subItems });
  }
  function addSub() { setEditing({ ...editing, subItems: [...editing.subItems, emptySub()] }); }
  function removeSub(idx) { setEditing({ ...editing, subItems: editing.subItems.filter((_, i) => i !== idx) }); }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="heading text-xl">Menu</h2>
        <button onClick={() => setEditing(emptyItem())} className="btn-primary text-xs">Add menu item</button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item._id} className="card bg-surface-dark border-border-dark p-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="text-sm font-body text-text-dark">
                {item.label} {item.isHidden && <span className="text-xs text-muted-dark ml-2">(hidden)</span>}
                <span className="text-xs text-muted-dark ml-2">{item.subItems?.length || 0} sub-items</span>
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => setEditing(JSON.parse(JSON.stringify(item)))} className="btn-outline">Edit</button>
                <button onClick={() => toggleHide(item._id)} className="btn-outline">{item.isHidden ? "Show" : "Hide"}</button>
                <button onClick={() => remove(item._id)} className="btn-outline text-red-400 border-red-400">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={save} className="card bg-surface-dark border-border-dark p-6 w-full max-w-lg space-y-3 my-8">
            <h3 className="heading text-lg mb-2">{editing._id ? "Edit" : "Add"} menu item</h3>

            <input placeholder="Label" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
            <input placeholder="Icon key (lucide-react name, e.g. home)" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />
            <input placeholder="Destination (used only if NO sub-items, e.g. /av-coins)" value={editing.destination} onChange={(e) => setEditing({ ...editing, destination: e.target.value })}
                   className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none" />

            <div className="border-t border-border-dark pt-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-muted-dark font-body">Sub-menu items</p>
                <button type="button" onClick={addSub} className="btn-outline text-xs">+ Add sub-item</button>
              </div>
              <div className="space-y-2">
                {editing.subItems.map((sub, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input placeholder="Label" value={sub.label} onChange={(e) => updateSub(idx, "label", e.target.value)}
                           className="flex-1 rounded-lg px-2 py-1 bg-bg-dark border border-border-dark text-xs font-body text-text-dark outline-none" />
                    <input placeholder="Icon" value={sub.icon} onChange={(e) => updateSub(idx, "icon", e.target.value)}
                           className="w-20 rounded-lg px-2 py-1 bg-bg-dark border border-border-dark text-xs font-body text-text-dark outline-none" />
                    <input placeholder="Destination (route or popup:key)" value={sub.destination} onChange={(e) => updateSub(idx, "destination", e.target.value)}
                           className="flex-1 rounded-lg px-2 py-1 bg-bg-dark border border-border-dark text-xs font-body text-text-dark outline-none" />
                    <button type="button" onClick={() => removeSub(idx)} className="text-red-400 text-xs">✕</button>
                  </div>
                ))}
                {!editing.subItems.length && <p className="text-xs text-muted-dark font-body">No sub-items — destination above will be used directly.</p>}
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
