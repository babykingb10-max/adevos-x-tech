import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import api from "../../api/client";
import Modal from "../ui/Modal";

const iconFor = (key) => Icons[
  (key || "graduation-cap").replace(/(^\w|-\w)/g, (m) => m.replace("-", "").toUpperCase())
] || Icons.GraduationCap;

export default function TutorialsPopup({ onClose }) {
  const [tutorials, setTutorials] = useState([]);
  const [playing, setPlaying] = useState(null);

  useEffect(() => { api.get("/tutorials").then((r) => setTutorials(r.data)).catch(() => {}); }, []);

  if (playing) {
    return (
      <Modal title={playing.title} onClose={() => setPlaying(null)}>
        <video controls autoPlay src={playing.videoUrl} className="w-full rounded-lg" />
      </Modal>
    );
  }

  return (
    <Modal title="Available tutorials" onClose={onClose}>
      <div className="space-y-2">
        {tutorials.map((t) => {
          const Icon = iconFor(t.icon);
          return (
            <button key={t._id} onClick={() => setPlaying(t)}
              className="w-full flex items-center gap-3 card p-3 text-left">
              <Icon size={20} className="text-brand dark:text-brand-dark shrink-0" />
              <span className="text-sm font-body text-text dark:text-text-dark">{t.title}</span>
            </button>
          );
        })}
        {!tutorials.length && <p className="text-sm text-muted dark:text-muted-dark font-body">No tutorials yet.</p>}
      </div>
    </Modal>
  );
}
