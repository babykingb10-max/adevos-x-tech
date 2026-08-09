import { useEffect, useState } from "react";
import api from "../../api/client";
import Modal from "../ui/Modal";
import { getIcon } from "../../lib/icons";
import { useContentRefresh } from "../../context/SocketContext";

// Converts a normal YouTube watch/share URL into an embeddable URL.
function toYoutubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed${u.pathname}`;
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
    return url;
  } catch {
    return url;
  }
}

export default function TutorialsPopup({ onClose }) {
  const [tutorials, setTutorials] = useState([]);
  const [playing, setPlaying] = useState(null);
  const refresh = useContentRefresh("tutorials");

  useEffect(() => { api.get("/tutorials").then((r) => setTutorials(r.data)).catch(() => {}); }, [refresh]);

  if (playing) {
    return (
      <Modal title={playing.title} onClose={() => setPlaying(null)}>
        {playing.description && (
          <p className="text-sm text-muted dark:text-muted-dark font-body mb-3">{playing.description}</p>
        )}
        {playing.youtubeUrl ? (
          <div className="aspect-video">
            <iframe
              src={toYoutubeEmbed(playing.youtubeUrl)}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video controls autoPlay src={playing.videoUrl} className="w-full rounded-lg" />
        )}
      </Modal>
    );
  }

  return (
    <Modal title="Available tutorials" onClose={onClose}>
      <div className="space-y-2">
        {tutorials.map((t) => {
          const Icon = getIcon(t.icon);
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
