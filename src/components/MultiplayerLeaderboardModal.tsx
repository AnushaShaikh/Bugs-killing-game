import React, { useEffect } from "react";
import { MultiplayerPlayer, MultiplayerRoom } from "../types";
import { WEAPONS } from "../data/weapons";
import { Trophy, Crown, Medal, RotateCcw, Home, Share2, Users, Check, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";

interface MultiplayerLeaderboardModalProps {
  isOpen: boolean;
  room: MultiplayerRoom | null;
  myPlayerId: string | null;
  isHost: boolean;
  onRematch: () => void;
  onExitToMenu: () => void;
  onClose?: () => void;
}

export const MultiplayerLeaderboardModal: React.FC<MultiplayerLeaderboardModalProps> = ({
  isOpen,
  room,
  myPlayerId,
  isHost,
  onRematch,
  onExitToMenu,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      // Confetti burst for champion!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen || !room) return null;

  // Players sorted by standing:
  // 1st place is rank 1, then rank 2, etc.
  const players = [...room.players].sort((a, b) => {
    const rankA = a.eliminationRank ?? 999;
    const rankB = b.eliminationRank ?? 999;
    if (rankA !== rankB) return rankA - rankB;
    return b.score - a.score;
  });

  const winner = players.find((p) => p.eliminationRank === 1) || players[0];
  const isWinnerMe = winner?.id === myPlayerId;

  const handleShareResults = () => {
    const lines = [
      `🏆 Bug Whacker - Room ${room.roomId} Results!`,
      `👑 1st: ${winner?.name || "Player"} (${winner?.score.toLocaleString()} pts)`,
      ...players.slice(1, 6).map((p, idx) => `#${idx + 2}: ${p.name} (${p.score.toLocaleString()} pts)`),
      `Play with up to 12 players!`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm select-none overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Top Right Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Standings"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Banner */}
        <div className="relative p-5 bg-white border-b border-slate-200 text-slate-900 text-center">
          <div className="flex flex-col items-center">
            <div className="inline-flex p-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-2 text-amber-600 shadow-xs">
              <Crown className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Match Standings
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              {isWinnerMe ? "Victory — You Won The Match" : `${winner?.name || "Winner"} Won The Match`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Room {room.roomId} • Last Survivor
            </p>
          </div>
        </div>

        {/* Podium Top 3 (if 2+ players) */}
        {players.length >= 2 && (
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-end justify-center gap-2 text-center">
            {/* 2nd Place */}
            {players[1] && (
              <div className="flex flex-col items-center w-24 sm:w-28">
                <div className="text-lg mb-1">
                  {WEAPONS[players[1].weapon]?.icon || "👞"}
                </div>
                <div className="w-full bg-white border border-slate-200 rounded-t-xl p-2 h-20 flex flex-col justify-end shadow-xs">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {players[1].name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {players[1].score.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                    2nd Place
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place (Center, Tallest) */}
            {winner && (
              <div className="flex flex-col items-center w-28 sm:w-32">
                <div className="text-2xl mb-1 relative">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-current absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  {WEAPONS[winner.weapon]?.icon || "👞"}
                </div>
                <div className="w-full bg-amber-50/70 border border-amber-300 rounded-t-xl p-2.5 h-26 flex flex-col justify-end shadow-xs">
                  <div className="text-xs sm:text-sm font-bold text-amber-900 truncate">
                    {winner.name}
                  </div>
                  <div className="text-[10px] text-amber-700 font-mono">
                    {winner.score.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 mt-0.5">
                    1st Place
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {players[2] && (
              <div className="flex flex-col items-center w-24 sm:w-28">
                <div className="text-lg mb-1">
                  {WEAPONS[players[2].weapon]?.icon || "👞"}
                </div>
                <div className="w-full bg-white border border-slate-200 rounded-t-xl p-2 h-16 flex flex-col justify-end shadow-xs">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {players[2].name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {players[2].score.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                    3rd Place
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Complete Leaderboard Standings Table (All players 1 to 12) */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2">
            <span>Rankings ({players.length} Players)</span>
            <span>Score</span>
          </div>

          <div className="space-y-1">
            {players.map((p, idx) => {
              const rank = p.eliminationRank ?? idx + 1;
              const isMe = p.id === myPlayerId;
              const isFirst = rank === 1;

              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                    isFirst
                      ? "bg-amber-50/60 border-amber-200 text-slate-900 shadow-xs"
                      : isMe
                      ? "bg-slate-100/90 border-slate-300 text-slate-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {/* Left: Position Rank + Avatar + Name */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
                        isFirst
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : rank === 2
                          ? "bg-slate-100 text-slate-700 border border-slate-300"
                          : rank === 3
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {rank}
                    </span>

                    <span className="text-base">
                      {WEAPONS[p.weapon]?.icon || "👞"}
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                        <span>{p.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            YOU
                          </span>
                        )}
                        {p.isHost && (
                          <span className="text-[9px] font-medium px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            HOST
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {isFirst ? "Last player standing" : `Eliminated (Rank #${rank})`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Kills & Score */}
                  <div className="text-right">
                    <div className="text-xs font-semibold font-mono text-slate-900">
                      {p.score.toLocaleString()} pts
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {p.kills} squashes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleShareResults}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? "Copied" : "Copy Results"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onExitToMenu}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Main Menu</span>
            </button>

            {isHost ? (
              <button
                onClick={onRematch}
                id="room-rematch-button"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-lg text-xs font-semibold tracking-wide uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Lobby</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 font-normal">
                Waiting for host...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
