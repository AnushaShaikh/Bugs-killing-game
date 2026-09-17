import React, { useEffect } from "react";
import { MultiplayerPlayer, MultiplayerRoom } from "../types";
import { WEAPONS } from "../data/weapons";
import { Trophy, Crown, Medal, RotateCcw, Home, Share2, Users, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface MultiplayerLeaderboardModalProps {
  isOpen: boolean;
  room: MultiplayerRoom | null;
  myPlayerId: string | null;
  isHost: boolean;
  onRematch: () => void;
  onExitToMenu: () => void;
}

export const MultiplayerLeaderboardModal: React.FC<MultiplayerLeaderboardModalProps> = ({
  isOpen,
  room,
  myPlayerId,
  isHost,
  onRematch,
  onExitToMenu,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex p-3 rounded-full bg-slate-950/15 backdrop-blur-sm mb-2 text-slate-950">
              <Crown className="w-8 h-8 fill-current text-slate-950 animate-bounce" />
            </div>

            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900/80">
              MATCH FINAL STANDINGS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              {isWinnerMe ? "YOU WON THE MATCH!" : `${winner?.name || "Winner"} Wins!`}
            </h2>
            <p className="text-xs font-bold text-slate-900/90 mt-0.5">
              🏆 Last Bug Hunter Standing in Room {room.roomId}
            </p>
          </div>
        </div>

        {/* Podium Top 3 (if 2+ players) */}
        {players.length >= 2 && (
          <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 flex items-end justify-center gap-2 sm:gap-4 text-center">
            {/* 2nd Place */}
            {players[1] && (
              <div className="flex flex-col items-center w-24 sm:w-28">
                <div className="text-xl sm:text-2xl mb-1">
                  {WEAPONS[players[1].weapon]?.icon || "👞"}
                </div>
                <div className="w-full bg-slate-800 border border-slate-700 rounded-t-xl p-2 h-20 flex flex-col justify-end">
                  <div className="text-xs font-black text-slate-300 truncate">
                    {players[1].name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {players[1].score.toLocaleString()} pts
                  </div>
                  <span className="text-[10px] font-black text-slate-400 mt-0.5">
                    🥈 2nd
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place (Center, Tallest) */}
            {winner && (
              <div className="flex flex-col items-center w-28 sm:w-32">
                <div className="text-2xl sm:text-3xl mb-1 relative">
                  <Crown className="w-4 h-4 text-amber-400 fill-current absolute -top-2 left-1/2 -translate-x-1/2" />
                  {WEAPONS[winner.weapon]?.icon || "👞"}
                </div>
                <div className="w-full bg-gradient-to-t from-amber-500/30 to-amber-500/10 border-2 border-amber-400/60 rounded-t-2xl p-2.5 h-28 flex flex-col justify-end shadow-lg shadow-amber-500/10">
                  <div className="text-xs sm:text-sm font-black text-amber-300 truncate">
                    {winner.name}
                  </div>
                  <div className="text-[10px] text-amber-200 font-bold">
                    {winner.score.toLocaleString()} pts
                  </div>
                  <span className="text-[11px] font-black text-amber-400 mt-0.5">
                    🥇 1st Place
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {players[2] && (
              <div className="flex flex-col items-center w-24 sm:w-28">
                <div className="text-xl sm:text-2xl mb-1">
                  {WEAPONS[players[2].weapon]?.icon || "👞"}
                </div>
                <div className="w-full bg-slate-800 border border-slate-700 rounded-t-xl p-2 h-16 flex flex-col justify-end">
                  <div className="text-xs font-black text-slate-300 truncate">
                    {players[2].name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {players[2].score.toLocaleString()} pts
                  </div>
                  <span className="text-[10px] font-black text-amber-600 mt-0.5">
                    🥉 3rd
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Complete Leaderboard Standings Table (All players 1 to 12) */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
            <span>Standings ({players.length} Players)</span>
            <span>Kills / Score</span>
          </div>

          <div className="space-y-1.5">
            {players.map((p, idx) => {
              const rank = p.eliminationRank ?? idx + 1;
              const isMe = p.id === myPlayerId;
              const isFirst = rank === 1;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isFirst
                      ? "bg-amber-500/10 border-amber-500/50 text-white"
                      : isMe
                      ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-200"
                  }`}
                >
                  {/* Left: Position Rank + Avatar + Name */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        isFirst
                          ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                          : rank === 2
                          ? "bg-slate-300 text-slate-900"
                          : rank === 3
                          ? "bg-amber-700 text-amber-100"
                          : "bg-slate-700/80 text-slate-300"
                      }`}
                    >
                      {rank}
                    </span>

                    <span className="text-xl">
                      {WEAPONS[p.weapon]?.icon || "👞"}
                    </span>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span>{p.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-500 text-white">
                            YOU
                          </span>
                        )}
                        {p.isHost && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                            HOST
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isFirst ? "🏆 Last Player Standing" : `Out (Rank #${rank})`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Kills & Score */}
                  <div className="text-right">
                    <div className="text-xs font-black text-amber-300">
                      {p.score.toLocaleString()} pts
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {p.kills} squashes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleShareResults}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy Standings"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onExitToMenu}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              <span>Main Menu</span>
            </button>

            {isHost ? (
              <button
                onClick={onRematch}
                id="room-rematch-button"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again (Lobby)</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium italic">
                Waiting for host to start rematch...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
