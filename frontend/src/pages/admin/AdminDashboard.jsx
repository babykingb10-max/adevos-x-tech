import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../../api/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, deployments: 0 });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    api.get("/users").then((r) => setStats((s) => ({ ...s, users: r.data.length })));
    api.get("/deployment/admin/all").then((r) => setStats((s) => ({ ...s, deployments: r.data.length })));

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socket.emit("join-admin-live");
    socket.on("live-event", (event) => setActivity((prev) => [event, ...prev].slice(0, 20)));
    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <h2 className="heading text-xl mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card bg-surface-dark border-border-dark p-4">
          <p className="text-xs text-muted-dark font-body">Total users</p>
          <p className="text-2xl font-display font-semibold text-brand-dark">{stats.users}</p>
        </div>
        <div className="card bg-surface-dark border-border-dark p-4">
          <p className="text-xs text-muted-dark font-body">Total deployments</p>
          <p className="text-2xl font-display font-semibold text-brand-dark">{stats.deployments}</p>
        </div>
      </div>

      <h3 className="heading text-lg mb-3">Live activity</h3>
      <div className="card bg-surface-dark border-border-dark p-4 text-sm font-body space-y-1 max-h-64 overflow-y-auto">
        {activity.length ? activity.map((a, i) => <p key={i} className="text-muted-dark">{a}</p>) : (
          <p className="text-muted-dark">
            No live events yet — emit <code>io.to("admin-live").emit("live-event", "...")</code> from the backend
            on key actions (new user, new deployment, payment confirmed) to populate this feed in real time.
          </p>
        )}
      </div>
    </div>
  );
}
