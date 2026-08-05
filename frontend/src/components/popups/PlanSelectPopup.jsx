import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import Modal from "../ui/Modal";

export default function PlanSelectPopup({ onClose }) {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { api.get("/plans").then((r) => setPlans(r.data)).catch(() => {}); }, []);

  function choose(planKey) {
    onClose();
    navigate(`/bots?plan=${planKey}`);
  }

  return (
    <Modal title="Choose your plan" onClose={onClose}>
      <div className="space-y-4">
        {plans.map((p) => (
          <div key={p._id} className="card p-4">
            <p className="font-display font-semibold text-brand dark:text-brand-dark mb-1">{p.heading}</p>
            <p className="text-sm text-muted dark:text-muted-dark font-body mb-3">{p.description}</p>
            <ul className="text-xs font-body text-muted dark:text-muted-dark mb-3 list-disc list-inside">
              {p.features?.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <button onClick={() => choose(p.key)} className="btn-primary w-full text-sm">Continue</button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
