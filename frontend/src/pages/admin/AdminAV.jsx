import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminAV() {
  const [data, setData] = useState({ totalIssued: 0, users: [] });

  useEffect(() => { api.get("/av-coins/admin/overview").then((r) => setData(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <h2 className="heading text-xl mb-4">AV Coins overview</h2>
      <div className="card bg-surface-dark border-border-dark p-4 mb-6">
        <p className="text-xs text-muted-dark font-body">Total coins issued</p>
        <p className="text-2xl font-display font-semibold text-brand-dark">{data.totalIssued}</p>
      </div>

      <table className="w-full text-sm font-body">
        <thead className="text-muted-dark text-left">
          <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Coins</th><th className="p-2">Referrals</th></tr>
        </thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u._id} className="border-t border-border-dark">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.coins}</td>
              <td className="p-2">{u.totalReferrals}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
