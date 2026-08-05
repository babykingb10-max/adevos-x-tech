import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  async function load() { const { data } = await api.get("/users"); setUsers(data); }
  useEffect(() => { load(); }, []);

  async function toggleBlock(id) { await api.patch(`/users/${id}/block`); load(); }
  async function remove(id) { if (confirm("Remove this user?")) { await api.delete(`/users/${id}`); load(); } }
  async function setPlan(id, plan) { await api.patch(`/users/${id}/plan`, { plan }); load(); }

  return (
    <div>
      <h2 className="heading text-xl mb-4">Users</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="text-muted-dark text-left">
            <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Plan</th><th className="p-2">Coins</th><th className="p-2">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-border-dark">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <select value={u.plan} onChange={(e) => setPlan(u._id, e.target.value)} className="bg-bg-dark border border-border-dark rounded px-2 py-1 text-xs">
                    <option value="not_configured">Not configured</option>
                    <option value="user">User</option>
                    <option value="deployer">Deployer</option>
                  </select>
                </td>
                <td className="p-2">{u.coins}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => toggleBlock(u._id)} className="btn-outline text-xs">{u.isBlocked ? "Unblock" : "Block"}</button>
                  <button onClick={() => remove(u._id)} className="btn-outline text-xs text-red-400 border-red-400">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
