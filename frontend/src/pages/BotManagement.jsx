import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import { useConfirm } from "../context/ConfirmContext";

const STATUS_LABEL = {
  queued: "Queued", building: "Building", active: "Active",
  failed: "Failed", stopped: "Stopped",
};
const STATUS_COLOR = {
  queued: "text-yellow-500", building: "text-yellow-500",
  active: "text-brand dark:text-brand-dark", failed: "text-red-500", stopped: "text-muted dark:text-muted-dark",
};

export default function BotManagement() {
  const [deployments, setDeployments] = useState([]);
  const [ownerEditFor, setOwnerEditFor] = useState(null); // deployment | null
  const [ownerForm, setOwnerForm] = useState({ ownerName: "", ownerNumber: "" });
  const confirm = useConfirm();
  const navigate = useNavigate();

  async function load() {
    const { data } = await api.get("/deployment/mine");
    setDeployments(data);
  }
  useEffect(() => { load(); }, []);

  async function refreshStatus(id) {
    await api.post(`/deployment/${id}/refresh-status`);
    load();
  }

  async function restart(id) {
    await api.post(`/deployment/${id}/restart`);
    load();
  }

  async function stop(id) {
    if (!(await confirm("Stop this bot? It will go offline until restarted."))) return;
    await api.post(`/deployment/${id}/stop`);
    load();
  }

  async function remove(id) {
    if (!(await confirm("Delete this deployment permanently? This cannot be undone."))) return;
    await api.delete(`/deployment/${id}`);
    load();
  }

  async function redeploy(d) {
    if (!(await confirm("This will delete the current deployment so you can set it up again. Continue?"))) return;
    await api.delete(`/deployment/${d._id}`);
    navigate(`/deployment?bot=${d.bot._id}&duration=${d.packageDurationWeeks}`);
  }

  function changePlatform(d) {
    redeploy(d); // changing platform requires a fresh deployment — same flow as redeploy
  }

  function openOwnerEdit(d) {
    setOwnerEditFor(d);
    setOwnerForm({ ownerName: d.ownerName, ownerNumber: d.ownerNumber });
  }

  async function submitOwnerEdit(e) {
    e.preventDefault();
    await api.patch(`/deployment/${ownerEditFor._id}/owner-info`, ownerForm);
    setOwnerEditFor(null);
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card p-4 mb-6 flex justify-between items-center">
        <p className="font-body text-sm">Deployed bot(s): <b>{deployments.length}</b></p>
        <p className="font-body text-sm text-muted dark:text-muted-dark capitalize">{deployments[0]?.plan || "—"} plan</p>
      </div>

      {deployments.map((d) => (
        <div key={d._id} className="card p-4 mb-4">
          <Heading as="h3" className="text-base mb-2">{d.bot?.name}</Heading>
          <div className="text-sm font-body space-y-1 text-muted dark:text-muted-dark mb-4">
            <p>Owner Name: {d.ownerName}</p>
            <p>Owner Number: {d.ownerNumber}</p>
            <p>Platform: {d.platform?.name}</p>
            <p>Status: <span className={`font-semibold ${STATUS_COLOR[d.status]}`}>{STATUS_LABEL[d.status] || d.status}</span></p>
            <p>Package: {d.packageDurationWeeks} weeks</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => refreshStatus(d._id)} className="btn-outline text-xs">Refresh status</button>
            <button onClick={() => restart(d._id)} className="btn-outline text-xs">Restart</button>
            <button onClick={() => openOwnerEdit(d)} className="btn-outline text-xs">Change owner information</button>
            <button onClick={() => changePlatform(d)} className="btn-outline text-xs">Change platform</button>
            <button onClick={() => redeploy(d)} className="btn-outline text-xs">Redeploy</button>
            <button onClick={() => navigate(`/payment?plan=${d.plan}&bot=${d.bot._id}`)} className="btn-outline text-xs">Renew package</button>
            <button onClick={() => stop(d._id)} className="btn-outline text-xs">Stop</button>
            <button onClick={() => remove(d._id)} className="btn-outline text-xs text-red-500 border-red-500">Delete deployment</button>
          </div>
        </div>
      ))}

      {!deployments.length && (
        <p className="text-center text-muted dark:text-muted-dark font-body">No bots deployed yet. Deploy one from Available bots.</p>
      )}

      {ownerEditFor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={submitOwnerEdit} className="card p-6 w-full max-w-sm space-y-3">
            <Heading as="h3" className="text-lg mb-2">Change owner information</Heading>
            <input placeholder="Owner Name" value={ownerForm.ownerName} onChange={(e) => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
                   className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
            <input placeholder="Owner Number" value={ownerForm.ownerNumber} onChange={(e) => setOwnerForm({ ...ownerForm, ownerNumber: e.target.value })}
                   className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1 text-sm">Save</button>
              <button type="button" onClick={() => setOwnerEditFor(null)} className="btn-outline flex-1 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
