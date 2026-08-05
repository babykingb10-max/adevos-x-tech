import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import api from "../api/client";
import Heading from "../components/ui/Heading";
import { useAuth } from "../context/AuthContext";

export default function BotsAvailable() {
  const [params] = useSearchParams();
  const plan = params.get("plan") || "user";
  const [bots, setBots] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get(`/bots?plan=${plan}`).then((r) => setBots(r.data)).catch(() => {});
  }, [plan]);

  function handleDeploy(botId) {
    const hasValidPackage =
      user?.plan === plan &&
      user?.activePackage?.expiresAt &&
      new Date(user.activePackage.expiresAt) > new Date();

    if (hasValidPackage) {
      navigate(`/deployment?bot=${botId}&duration=${user.activePackage.durationWeeks}`);
    } else {
      navigate(`/payment?plan=${plan}&bot=${botId}`);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Heading as="h1" className="text-2xl text-center mb-8">
        Available bots — {plan === "deployer" ? "Deployer plan" : "User plan"}
      </Heading>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {bots.map((bot) =>
          bot.isFree ? (
            <div key={bot._id} className="card overflow-hidden">
              <div className="relative">
                <img src={bot.imageUrl} className="w-full h-32 object-cover" />
                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded font-body">Free bot</span>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted dark:text-muted-dark font-body mb-2">Adevos Min-Bot — free, no cost required.</p>
                <p className="text-[10px] text-muted dark:text-muted-dark font-body mb-2">By {bot.author}</p>
                <a href={bot.freeWebsiteUrl} target="_blank" rel="noreferrer" className="btn-primary text-xs w-full text-center block">Visit website</a>
              </div>
            </div>
          ) : (
            <div key={bot._id} className="card overflow-hidden">
              <div className="relative">
                <img src={bot.imageUrl} className="w-full h-32 object-cover" />
                <span className="absolute top-2 left-2 bg-black/70 text-yellow-400 text-xs px-2 py-0.5 rounded flex items-center gap-1 font-body">
                  <Star size={12} fill="currentColor" /> {bot.ratingAverage?.toFixed(1) || "0.0"}
                </span>
                {bot.badge === "popular" && (
                  <span className="absolute top-2 right-2 bg-brand-dark text-bg-dark text-xs px-2 py-0.5 rounded font-body">Popular</span>
                )}
                <button onClick={() => handleDeploy(bot._id)} className="absolute bottom-2 left-2 btn-primary text-xs">Deploy</button>
                <a href={bot.githubRepoUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 btn-outline text-xs bg-black/40 text-white border-white/40">Source</a>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold font-display text-text dark:text-text-dark">{bot.name}:</p>
                <p className="text-xs text-muted dark:text-muted-dark font-body mb-2">{bot.description}</p>
                <div className="flex justify-between items-center text-[10px] text-muted dark:text-muted-dark font-body">
                  <span>By {bot.author}</span>
                  <span>Rate ☆</span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {plan === "user" && (
        <div className="text-center mt-8">
          <button onClick={() => navigate("/bots?plan=deployer")} className="btn-outline">Upgrade to Deployer plan</button>
        </div>
      )}
    </div>
  );
}
