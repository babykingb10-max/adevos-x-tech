import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Square } from "lucide-react";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import { usePopup } from "../context/PopupContext";
import { getIcon } from "../lib/icons";

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
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const { open: openPopup } = usePopup();

  const botId = new URLSearchParams(window.location.search).get("bot");
  const locked = Boolean(deployment) && !["failed"].includes(deployment.status);

  useEffect(() => {
    const url = botId ? `/deployment/platforms?botId=${botId}` : "/deployment/platforms";
    api.get(url).then((r) => setPlatforms(r.data)).catch(() => {});
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

  useEffect(() => {
    if (isPlaying) audioRef.current?.play().catch(() => {});
    else audioRef.current?.pause();
  }, [isPlaying, playingIdx]);

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

  const canDeploy = platformId && ownerName && ownerNumber && sessionId && !locked;
  const currentTrack = music[playingIdx];
  const selectedPlatform = platforms.find((p) => p._id === platformId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Step-by-step guide — read this first */}
      <div className="card p-4 mb-6">
        <Heading as="h2" className="text-base mb-3">How to deploy your bot</Heading>
        <ol className="text-sm font-body text-muted dark:text-muted-dark space-y-2 list-none">
          <li><b className="text-text dark:text-text-dark">1.</b> Pick a hosting platform below — "Recommended" is the safest choice if you're unsure.</li>
          <li><b className="text-text dark:text-text-dark">2.</b> Fill in the bot owner's name and phone number — used only to identify your bot, never sent to the bot itself.</li>
          <li><b className="text-text dark:text-text-dark">3.</b> Open the pairing site, link your WhatsApp/Telegram, then copy the Session ID it gives you.</li>
          <li><b className="text-text dark:text-text-dark">4.</b> Paste that Session ID below and press Deploy.</li>
          <li><b className="text-text dark:text-text-dark">5.</b> Wait for the build logs to finish — don't close this page until it says "Successfully".</li>
        </ol>
      </div>

      {music.length > 0 && (
        <div className="card p-4 mb-6">
          <p className="text-xs text-muted dark:text-muted-dark font-body mb-3">
            Optional: play some music while your bot deploys. It won't affect the build.
          </p>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-brand/20 dark:bg-brand-dark/20 border-2 border-brand dark:border-brand-dark flex items-center justify-center shrink-0 ${isPlaying ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }}>
              <div className="w-3 h-3 rounded-full bg-brand dark:bg-brand-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body text-text dark:text-text-dark truncate">{currentTrack?.title}</p>
              <p className="text-xs text-muted dark:text-muted-dark truncate">{currentTrack?.artist}</p>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            <button onClick={() => setPlayingIdx((i) => (i - 1 + music.length) % music.length)} aria-label="Previous"
                    className="w-8 h-8 rounded-full btn-outline flex items-center justify-center p-0"><SkipBack size={14} /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? "Pause" : "Play"}
                    className="w-8 h-8 rounded-full btn-primary flex items-center justify-center p-0">
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={() => { audioRef.current.currentTime = 0; }} aria-label="Replay"
                    className="w-8 h-8 rounded-full btn-outline flex items-center justify-center p-0"><RotateCcw size={14} /></button>
            <button onClick={() => setPlayingIdx((i) => (i + 1) % music.length)} aria-label="Next"
                    className="w-8 h-8 rounded-full btn-outline flex items-center justify-center p-0"><SkipForward size={14} /></button>
            <button onClick={() => setIsPlaying(false)} aria-label="Stop"
                    className="w-8 h-8 rounded-full btn-outline flex items-center justify-center p-0"><Square size={12} /></button>
          </div>
          <audio ref={audioRef} src={currentTrack?.url} onEnded={() => setPlayingIdx((i) => (i + 1) % music.length)} />
        </div>
      )}

      <Heading as="h2" className="text-lg text-center mb-4">Available platforms</Heading>
      {locked ? (
        <p className="text-center text-sm font-body mb-8 font-bold">{selectedPlatform?.name}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {platforms.map((p) => {
            const Icon = getIcon(p.icon);
            const isSelected = platformId === p._id;
            return (
              <button key={p._id} onClick={() => setPlatformId(p._id)}
                className={`card p-3 text-left ${isSelected ? "border-2 border-brand dark:border-brand-dark bg-brand/5 dark:bg-brand-dark/5" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="text-brand dark:text-brand-dark" size={20} />
                  {p.badge !== "none" && (
                    <span className="text-[10px] uppercase bg-brand-dark text-bg-dark px-1.5 py-0.5 rounded font-body">{p.badge}</span>
                  )}
                </div>
                <p className="text-sm font-body font-bold text-text dark:text-text-dark">{p.name}</p>
              </button>
            );
          })}
        </div>
      )}

      <Heading as="h2" className="text-lg text-center mb-4">Bot owner information</Heading>
      <div className="card p-4 space-y-3 mb-8">
        <p className="text-xs text-muted dark:text-muted-dark font-body">
          1. This is only used to label your bot on our side — it is never sent into the bot's own configuration.
        </p>
        <input placeholder="Owner Name" value={ownerName} disabled={locked} onChange={(e) => setOwnerName(e.target.value)}
               className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none disabled:opacity-50" />
        <input placeholder="Owner Number" value={ownerNumber} disabled={locked} onChange={(e) => setOwnerNumber(e.target.value)}
               className="w-full rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none disabled:opacity-50" />
      </div>

      <Heading as="h2" className="text-lg text-center mb-4">Device pairing / WhatsApp number pairing</Heading>
      <div className="card p-4 mb-8">
        <p className="text-xs text-muted dark:text-muted-dark font-body mb-3">
          1. Tap Open to launch the pairing site. 2. Scan or link your number there. 3. Copy the Session ID it gives you — you'll paste it below.
        </p>
        <div className="flex gap-3">
          <a href={bot?.pairSiteUrl || "#"} target="_blank" rel="noreferrer"
             className={`btn-outline text-xs flex-1 text-center ${!bot?.pairSiteUrl ? "opacity-40 pointer-events-none" : ""}`}>Open</a>
          <button
            onClick={() => bot?.pairSiteUrl && navigator.share ? navigator.share({ url: bot.pairSiteUrl, title: "Pair your device" }) : navigator.clipboard.writeText(bot?.pairSiteUrl || "")}
            disabled={!bot?.pairSiteUrl}
            className="btn-outline text-xs flex-1 disabled:opacity-40">Share</button>
        </div>
      </div>

      <Heading as="h2" className="text-lg text-center mb-4">Deployment</Heading>
      <div className="card p-4 mb-6">
        <p className="text-xs text-muted dark:text-muted-dark font-body mb-3">
          1. Paste the Session ID from the pairing step. 2. Press Deploy and don't close this page until it finishes.
        </p>
        <div className="flex gap-2">
          <input placeholder="Paste session ID" value={sessionId} disabled={locked} onChange={(e) => setSessionId(e.target.value)}
                 className="flex-1 rounded-full px-4 py-2 bg-bg dark:bg-bg-dark border border-border dark:border-border-dark text-sm font-body outline-none disabled:opacity-50" />
          <button disabled={!canDeploy} onClick={handleDeploy} className="btn-primary disabled:opacity-40">Deploy</button>
        </div>
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
