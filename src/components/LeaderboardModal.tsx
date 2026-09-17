import React, { useEffect, useState } from "react";
import { LeaderboardEntry } from "../types";
import { WEAPONS } from "../data/weapons";
import { Trophy, Medal, X, Flame, Crosshair, Sparkles } from "lucide-react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
  currentKills?: number;
  currentAccuracy?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  currentKills,
  currentAccuracy,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterWeapon, setFilterWeapon] = useState<string>("all");
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("bugwhacker_player_name") || "SmashPro"
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      setHasSubmitted(false);
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentScore || hasSubmitted) return;

    localStorage.setItem("bugwhacker_player_name", playerName);

    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          score: currentScore,
          kills: currentKills || 0,
          accuracy: currentAccuracy || 80,
          weapon: "shoe",
          mode: "arcade",
        }),
      });
      if (res.ok) {
        setHasSubmitted(true);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const filteredEntries = filterWeapon === "all"
    ? entries
    : entries.filter((e) => e.weapon === filterWeapon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Global Leaderboard</h2>
              <p className="text-xs text-amber-100 font-medium">Top bug exterminators worldwide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-leaderboard-modal"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Submit Current Score Banner if applicable */}
        {typeof currentScore === "number" && currentScore > 0 && !hasSubmitted && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Your Latest Match: {currentScore.toLocaleString()} pts ({currentKills} bugs)
              </span>
            </div>
            <form onSubmit={handleSubmitScore} className="flex gap-2">
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                id="submit-score-button"
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Submit Rank
              </button>
            </form>
          </div>
        )}

        {/* Filter Weapon Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-1 overflow-x-auto text-xs font-bold">
          <div className="flex gap-1.5">
            {["all", "shoe", "newspaper", "swatter"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterWeapon(tab)}
                className={`px-3 py-1.5 rounded-xl transition-all capitalize ${
                  filterWeapon === tab
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {tab === "all" ? "All Weapons" : WEAPONS[tab as keyof typeof WEAPONS]?.name || tab}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-semibold px-2">
            {filteredEntries.length} Ranked
          </span>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold text-sm animate-pulse">
              Loading global rankings...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No scores recorded yet for this weapon category.
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isTop3 = index < 3;
              const medalColors = [
                "bg-amber-100 text-amber-700 border-amber-300",
                "bg-slate-200 text-slate-700 border-slate-300",
                "bg-orange-100 text-orange-700 border-orange-300",
              ];
              const weaponInfo = WEAPONS[entry.weapon] || WEAPONS.shoe;

              return (
                <div
                  key={entry.id || index}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isTop3
                      ? "bg-white border-amber-200 shadow-sm"
                      : "bg-white/70 border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center border-2 ${
                        isTop3
                          ? medalColors[index]
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {isTop3 ? (
                        <Medal className="w-4 h-4" />
                      ) : (
                        `#${index + 1}`
                      )}
                    </div>

                    {/* Name & Details */}
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{entry.name}</span>
                        <span className="text-base" title={weaponInfo.name}>
                          {weaponInfo.icon}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-red-500" />
                          {entry.kills} bugs
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Crosshair className="w-3 h-3 text-blue-500" />
                          {entry.accuracy}% acc
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 block leading-tight">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Points
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-colors shadow-sm"
          >
            Back to Household
          </button>
        </div>
      </div>
    </div>
  );
};
