import { useEffect, useState } from "react";
import api from "../api/client";
import Heading from "../components/ui/Heading";

export default function BotManagement() {
  const [deployments, setDeployments] = useState([]);

  useEffect(() => {
    api.get("/deployment/mine").then((r) => setDeployments(r.data)).catch(() => {});
  }, []);

  async function act(action, id) {
    if (["stop", "delete"].includes(action) && !confirm(`Are you sure you want to ${action}?`)) return;
    if (action === "delete") await api.delete(`/deployment/${id}`);
    else await api.post(`/deployment/${id}/${action}`);
    const { data } = await api.get("/deployment/mine");
    setDeployments(data);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card p-4 mb-6 flex justify-between items-center">
        <p className="font-body text-sm">Deployed bot(s): <b>{deployments.length}</b></p>
        <p className="font-body text-sm text-muted dark:text-muted-dark">{deployments[0]?.plan || "—"} plan</p>
      </div>

      {deployments.map((d) => (
        <div key={d._id} className="card p-4 mb-4">
          <Heading as="h3" className="text-base mb-2">{d.bot?.name}</Heading>
          <div className="text-sm font-body space-y-1 text-muted dark:text-muted-dark mb-4">
            <p>Owner Name: {d.ownerName}</p>
            <p>Owner Number: {d.ownerNumber}</p>
            <p>Platform: {d.platform?.name}</p>
            <p>Status: <span className={d.status === "active" ? "text-brand dark:text-brand-dark" : ""}>{d.status}</span></p>
            <p>Package: {d.packageDurationWeeks} weeks</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => act("restart", d._id)} className="btn-outline text-xs">Restart</button>
            <button onClick={() => act("stop", d._id)} className="btn-outline text-xs">Stop</button>
            <button onClick={() => act("delete", d._id)} className="btn-outline text-xs text-red-500 border-red-500">Delete deployment</button>
          </div>
        </div>
      ))}

      {!deployments.length && (
        <p className="text-center text-muted dark:text-muted-dark font-body">No bots deployed yet. Deploy one from Available bots.</p>
      )}
    </div>
  );
}
