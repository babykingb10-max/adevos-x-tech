import { useEffect, useState } from "react";
import api from "../../api/client";
import { useConfirm } from "../../context/ConfirmContext";

export default function AdminResponses() {
  const [responses, setResponses] = useState([]);
  const confirm = useConfirm();

  async function load() { const { data } = await api.get("/feedback"); setResponses(data); }
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) { await api.patch(`/feedback/${id}/status`, { status }); load(); }
  async function remove(id) { if (await confirm("Delete this response?")) { await api.delete(`/feedback/${id}`); load(); } }

  return (
    <div>
      <h2 className="heading text-xl mb-4">Responses</h2>
      <div className="space-y-2">
        {responses.map((r) => (
          <div key={r._id} className="card bg-surface-dark border-border-dark p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs uppercase text-brand-dark font-body">{r.category.replace("_", " ")}</span>
                <p className="text-sm font-body text-text-dark">{r.message}</p>
                <p className="text-xs text-muted-dark font-body mt-1">{r.name} · {r.email}</p>
              </div>
              <button onClick={() => remove(r._id)} className="btn-outline text-xs text-red-400 border-red-400 shrink-0">Delete</button>
            </div>
            <select value={r.status} onChange={(e) => setStatus(r._id, e.target.value)}
                    className="bg-bg-dark border border-border-dark rounded px-2 py-1 text-xs font-body">
              <option value="new">New</option>
              <option value="in_review">In review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        ))}
        {!responses.length && <p className="text-muted-dark text-sm font-body">No responses yet.</p>}
      </div>
    </div>
  );
}
