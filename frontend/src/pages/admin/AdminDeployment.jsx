import { useEffect, useState } from "react";
import api from "../../api/client";
import AdminCrudSection from "../../components/admin/AdminCrudSection";
import { useConfirm } from "../../context/ConfirmContext";

export default function AdminDeployment() {
  const [deployments, setDeployments] = useState([]);
  const [tab, setTab] = useState("live"); // "live" | "platforms" | "music"
  const confirm = useConfirm();

  useEffect(() => {
    if (tab === "live") api.get("/deployment/admin/all").then((r) => setDeployments(r.data)).catch(() => {});
  }, [tab]);

  async function removeDeployment(id) {
    if (!(await confirm("Delete this deployment? This calls the hosting platform's API to remove it too, and removes it from the database permanently."))) return;
    await api.delete(`/deployment/admin/${id}`);
    const { data } = await api.get("/deployment/admin/all");
    setDeployments(data);
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["live", "platforms", "music"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn text-xs ${tab === t ? "btn-primary" : "btn-outline"}`}>
            {t === "live" ? "Live deployments" : t === "platforms" ? "Platforms" : "Music"}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <div>
          <h2 className="heading text-xl mb-4">Live deployments</h2>
          <div className="space-y-2">
            {deployments.map((d) => (
              <div key={d._id} className="card bg-surface-dark border-border-dark p-3 flex justify-between items-center text-sm font-body">
                <div>
                  <p>{d.bot?.name} — {d.user?.name} ({d.user?.email})</p>
                  <p className="text-xs text-muted-dark">{d.platform?.name} · status: {d.status}</p>
                </div>
                <button onClick={() => removeDeployment(d._id)} className="btn-outline text-xs text-red-400 border-red-400">Delete</button>
              </div>
            ))}
            {!deployments.length && <p className="text-muted-dark text-sm font-body">No deployments yet.</p>}
          </div>
        </div>
      )}

      {tab === "platforms" && (
        <AdminCrudSection title="Deployment platforms" endpoint="/deployment-platforms"
          fields={[{ key: "name", label: "Name" }, { key: "icon", label: "Icon", type: "icon" },
                   { key: "apiIdentifier", label: "API identifier", type: "select", options: [
                       { value: "heroku", label: "Heroku" }, { value: "railway", label: "Railway" },
                       { value: "render", label: "Render" }, { value: "other", label: "Other (manual deploy only)" }] },
                   { key: "badge", label: "Badge", type: "select", options: [
                       { value: "none", label: "None" }, { value: "recommended", label: "Recommended" },
                       { value: "slow", label: "Slow / busy" }, { value: "issues", label: "Has issues" }] }]} />
      )}

      {tab === "music" && (
        <AdminCrudSection title="Deployment music" endpoint="/deployment-music"
          fields={[{ key: "title", label: "Title" }, { key: "artist", label: "Artist" }, { key: "url", label: "Audio URL" }]} />
      )}
    </div>
  );
}
