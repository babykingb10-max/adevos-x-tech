import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import { usePopup } from "../context/PopupContext";

export default function Deployment() {
  const [platforms, setPlatforms] = useState([]);
  const [music, setMusic] = useState([]);
  const [bot, setBot] = useState(null);
  const [platformId, setPlatformId] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [ownerNumber, setOwnerNumber] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);
  const [deployment, setDeployment] = useState(null);
  const [playingIdx, setPlayingIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();
  const { open: openPopup } = usePopup();

  const botId = new URLSearchParams(window.location.search).get("bot");

  useEffect(() => {
    api.get("/deployment/platforms").then((r) => setPlatforms(r.data)).catch(() => {});
    api.get("/deployment/music").then((r) => setMusic(r.data)).catch(() => {});
    if (botId) api.get(`/bots/${botId}`).then((r) => setBot(r.data)).catch(() => {});
  }, [botId]);

  useEffect(() => {
    if (!deployment) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socket.emit("join-deployment", deployment._id);
    socket.on("build-log", (line) => setLogs((prev) => [...prev, line]));
    socket.on("build-status", (status) => setDeployment((d) => ({ ...d, status })));
    return () => socket.disconnect();
  }, [deployment]);

  async function handleDeploy() {
    const searchParams = new URLSearchParams(window.location.search);
    const { data } = await api.post("/deployment", {
      botId: searchParams.get("bot"),
      platformId, ownerName, ownerNumber, sessionId,
      durationWeeks: Number(searchParams.get("duration")) || 4,
    });
    setDeployment(data);
    setLogs(data.buildLogs || []);
  }

  const canDeploy = platformId && ownerName && ownerNumber && sessionId;
  const currentTrack = music[playingIdx];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {music.length > 0 && (
        <div className="card p-4 mb-6 text-sm font-body flex items-center justify-between">
          <div>
            <p className="text-text dark:text-text-dark">{currentTrack?.title}</p>
            <p className="text-xs text-muted dark:text-muted-dark">{currentTrack?.artist}</p>
          </div>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setPlayingIdx((i) => (i - 1 + music.length) % music.length)} className="btn-outline">⏮</button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="btn-primary">{isPlaying ? "⏸" : "▶"}</button>
            <button onClick={() => setPlayingIdx((i) => (i + 1) % music.length)} className="btn-outline">⏭</button>
          </div>
          {isPlaying && <audio autoPlay src={currentTrack?.url} onEnded={() => setPlayingIdx((i) => (i + 1) % music.length)} />}
        </div>
      )}

      <Heading as="h2" className="text-lg text-center mb-4">Available platforms</Heading>
      <div className="flex gap-3 justify-center flex-wrap mb-8">
        {platforms.map((p) => (
          <button key={p._id} onClick={() => setPlatformId(p._id)}
            className={`card px-4 py-3 text-sm font-body ${platformId === p._id ? "border-brand dark:border-brand-dark" : ""}`}>
            {p.name} {p.badge !== "none" && <span className="block text-[10px] text-brand dark:text-brand-dark">{p.badge}</span>}
          </button>
        ))}
      </div>

      <Heading as="h2" className="text-lg text-center mb-4">Bot owner information</Heading>
      <div className="card p-4 space-y-3 mb-8">
        <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
               className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
        <input placeholder="Owner Number" value={ownerNumber} onChange={(e) => setOwnerNumber(e.target.value)}
               className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
      </div>

      <Heading as="h2" className="text-lg text-center mb-4">Device pairing / WhatsApp number pairing</Heading>
      <div className="card p-4 flex gap-3 mb-8">
        <a href={bot?.pairSiteUrl || "#"} target="_blank" rel="noreferrer"
           className={`btn-outline text-xs flex-1 text-center ${!bot?.pairSiteUrl ? "opacity-40 pointer-events-none" : ""}`}>Open</a>
        <button
          onClick={() => bot?.pairSiteUrl && navigator.share ? navigator.share({ url: bot.pairSiteUrl, title: "Pair your device" }) : navigator.clipboard.writeText(bot?.pairSiteUrl || "")}
          disabled={!bot?.pairSiteUrl}
          className="btn-outline text-xs flex-1 disabled:opacity-40">Share</button>
      </div>

      <Heading as="h2" className="text-lg text-center mb-4">Deployment</Heading>
      <div className="card p-4 flex gap-2 mb-6">
        <input placeholder="Paste session ID" value={sessionId} onChange={(e) => setSessionId(e.target.value)}
               className="flex-1 rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none" />
        <button disabled={!canDeploy} onClick={handleDeploy} className="btn-primary disabled:opacity-40">Deploy</button>
      </div>

      {deployment && (
        <div className="card p-4">
          <button onClick={() => setShowLogs(!showLogs)} className="text-xs text-brand dark:text-brand-dark font-body mb-2">
            {showLogs ? "Hide" : "View"} building logs
          </button>
          {showLogs && (
            <pre className="text-xs font-body bg-black/80 text-green-400 p-3 rounded max-h-40 overflow-y-auto">
              {logs.join("\n")}
            </pre>
          )}
          {deployment.status === "active" && (
            <p className="text-sm font-body mt-3">
              Successfully! You can now{" "}
              <button onClick={() => navigate("/bot-management")} className="font-bold text-brand dark:text-brand-dark">Manage</button> your bot.
            </p>
          )}
          {deployment.status === "failed" && (
            <p className="text-sm font-body mt-3">
              Bot build failed.{" "}
              <button onClick={() => openPopup("feedback", { category: "bug" })} className="font-bold text-brand dark:text-brand-dark">Report</button>
              {" "}this as error/bug or redeploy again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
