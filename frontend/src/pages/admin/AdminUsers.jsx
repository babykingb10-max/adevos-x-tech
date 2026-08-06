import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [bulkAmount, setBulkAmount] = useState("");
  const [grantForm, setGrantForm] = useState(null); // { userId, plan, durationWeeks }

  async function load() { const { data } = await api.get("/users"); setUsers(data); }
  useEffect(() => { load(); }, []);

  async function toggleBlock(id) { await api.patch(`/users/${id}/block`); load(); }
  async function remove(id) { if (confirm("Remove this user?")) { await api.delete(`/users/${id}`); load(); } }

  async function adjustCoins(id) {
    const amount = prompt("Amount to add (use a negative number to deduct):");
    if (amount === null || amount === "") return;
    await api.patch(`/users/${id}/coins`, { amount: Number(amount) });
    load();
  }

  async function bulkAdjustCoins() {
    if (!selected.length || !bulkAmount) return;
    await api.post("/users/bulk/coins", { userIds: selected, amount: Number(bulkAmount) });
    setBulkAmount("");
    setSelected([]);
    load();
  }

  async function submitGrant(e) {
    e.preventDefault();
    await api.post(`/users/${grantForm.userId}/grant-plan`, {
      plan: grantForm.plan, durationWeeks: Number(grantForm.durationWeeks),
    });
    setGrantForm(null);
    load();
  }

  function toggleSelect(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div>
      <h2 className="heading text-xl mb-4">Users</h2>

      {selected.length > 0 && (
        <div className="card bg-surface-dark border-border-dark p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-body text-muted-dark">{selected.length} selected</span>
          <input type="number" placeholder="Coins amount (+/-)" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)}
                 className="bg-bg-dark border border-border-dark rounded px-2 py-1 text-xs w-40" />
          <button onClick={bulkAdjustCoins} className="btn-primary text-xs">Apply to selected</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="text-muted-dark text-left">
            <tr>
              <th className="p-2"></th>
              <th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Plan</th>
              <th className="p-2">Coins</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-border-dark align-top">
                <td className="p-2"><input type="checkbox" checked={selected.includes(u._id)} onChange={() => toggleSelect(u._id)} /></td>
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  {u.plan}
                  {u.activePackage?.expiresAt && new Date(u.activePackage.expiresAt) > new Date() && (
                    <span className="block text-[10px] text-brand-dark">
                      active · {u.activePackage.durationWeeks}w
                    </span>
                  )}
                </td>
                <td className="p-2">{u.coins}</td>
                <td className="p-2 flex flex-wrap gap-2">
                  <button onClick={() => setGrantForm({ userId: u._id, plan: "user", durationWeeks: 2 })} className="btn-outline text-xs">Grant plan</button>
                  <button onClick={() => adjustCoins(u._id)} className="btn-outline text-xs">Adjust coins</button>
                  <button onClick={() => toggleBlock(u._id)} className="btn-outline text-xs">{u.isBlocked ? "Unblock" : "Block"}</button>
                  <button onClick={() => remove(u._id)} className="btn-outline text-xs text-red-400 border-red-400">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {grantForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={submitGrant} className="card bg-surface-dark border-border-dark p-6 w-full max-w-sm space-y-3">
            <h3 className="heading text-lg mb-2">Grant plan (bypasses payment)</h3>
            <label className="text-xs text-muted-dark font-body block mb-1">Plan</label>
            <select value={grantForm.plan} onChange={(e) => setGrantForm({ ...grantForm, plan: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none">
              <option value="user">User</option>
              <option value="deployer">Deployer</option>
            </select>
            <label className="text-xs text-muted-dark font-body block mb-1">Duration (weeks)</label>
            <select value={grantForm.durationWeeks} onChange={(e) => setGrantForm({ ...grantForm, durationWeeks: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 bg-bg-dark border border-border-dark text-sm font-body text-text-dark outline-none">
              <option value={2}>2 weeks</option>
              <option value={4}>4 weeks</option>
              <option value={8}>8 weeks</option>
            </select>
            <p className="text-xs text-muted-dark font-body">
              This immediately activates the plan as if paid — the user can deploy right away, no payment required.
            </p>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1">Grant</button>
              <button type="button" onClick={() => setGrantForm(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
