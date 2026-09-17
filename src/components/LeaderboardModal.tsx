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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Global Leaderboard</h2>
              <p className="text-xs text-slate-500 font-normal">Top extermination records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-leaderboard-modal"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Submit Current Score Banner if applicable */}
        {typeof currentScore === "number" && currentScore > 0 && !hasSubmitted && (
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Latest match: <strong className="text-slate-900 font-mono">{currentScore.toLocaleString()} pts</strong> ({currentKills} smashed)
              </span>
            </div>
            <form onSubmit={handleSubmitScore} className="flex gap-2">
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <button
                type="submit"
                id="submit-score-button"
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Submit Rank
              </button>
            </form>
          </div>
        )}

        {/* Filter Weapon Tabs */}
        <div className="p-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-1 overflow-x-auto text-xs font-medium">
          <div className="flex gap-1">
            {["all", "shoe", "newspaper", "swatter"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterWeapon(tab)}
                className={`px-2.5 py-1 rounded-md transition-colors capitalize text-xs cursor-pointer ${
                  filterWeapon === tab
                    ? "bg-white text-slate-900 font-semibold border border-slate-200 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab === "all" ? "All Weapons" : WEAPONS[tab as keyof typeof WEAPONS]?.name || tab}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 px-2">
            {filteredEntries.length} Ranked
          </span>
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="py-10 text-center text-slate-400 font-medium text-xs">
              Loading rankings...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No recorded scores for this category yet.
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isTop3 = index < 3;
              const medalColors = [
                "bg-amber-50 text-amber-800 border-amber-300",
                "bg-slate-100 text-slate-700 border-slate-300",
                "bg-amber-50/50 text-amber-700 border-amber-200",
              ];
              const weaponInfo = WEAPONS[entry.weapon] || WEAPONS.shoe;

              return (
                <div
                  key={entry.id || index}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    isTop3
                      ? "bg-slate-50 border-slate-200"
                      : "bg-white border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center border ${
                        isTop3
                          ? medalColors[index]
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {isTop3 ? (
                        <Medal className="w-3.5 h-3.5" />
                      ) : (
                        `${index + 1}`
                      )}
                    </div>

                    {/* Name & Details */}
                    <div>
                      <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{entry.name}</span>
                        <span className="text-sm" title={weaponInfo.name}>
                          {weaponInfo.icon}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-slate-400" />
                          {entry.kills} bugs
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Crosshair className="w-3 h-3 text-slate-400" />
                          {entry.accuracy}% acc
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900 font-mono block leading-tight">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">
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
            className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors border border-slate-200 cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
