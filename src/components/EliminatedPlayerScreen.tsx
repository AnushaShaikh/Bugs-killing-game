import React from "react";
import { MultiplayerPlayer, MultiplayerRoom } from "../types";
import { WEAPONS } from "../data/weapons";
import { Skull, Trophy, Heart, Users, Home, Award } from "lucide-react";

interface EliminatedPlayerScreenProps {
  room: MultiplayerRoom | null;
  myPlayerId: string | null;
  myEliminationRank?: number;
  onExitToMenu: () => void;
}

export const EliminatedPlayerScreen: React.FC<EliminatedPlayerScreenProps> = ({
  room,
  myPlayerId,
  myEliminationRank,
  onExitToMenu,
}) => {
  if (!room) return null;

  // Sort players for live standings:
  // Active players sorted by score descending first, followed by eliminated players sorted by eliminationRank ascending
  const players = [...room.players].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "alive" ? -1 : 1;
    }
    if (a.status === "out" && b.status === "out") {
      const rankA = a.eliminationRank ?? 999;
      const rankB = b.eliminationRank ?? 999;
      if (rankA !== rankB) return rankA - rankB;
    }
    return b.score - a.score;
  });

  const alivePlayers = players.filter((p) => p.status === "alive");
  const myPlayer = room.players.find((p) => p.id === myPlayerId);

  return (
    <div
      id="eliminated-player-screen"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md select-none overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-b from-rose-50 to-white px-6 pt-7 pb-5 text-center border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 mb-3">
            <Skull className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            You Are Out!
          </h2>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Final Placement:{" "}
              <strong className="font-mono text-slate-900">
                #{myEliminationRank || myPlayer?.eliminationRank || "—"} of {room.players.length}
              </strong>
            </span>
          </div>

          <p className="mt-2.5 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Match is still in progress. Below are the <strong>live scores</strong> of all players in
            the room. Final results will appear once the winner is decided!
          </p>
        </div>

        {/* Live Standings Status Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">Live Player Scores</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span>
              <strong className="text-slate-800 font-mono">{alivePlayers.length}</strong> player
              {alivePlayers.length === 1 ? "" : "s"} remaining
            </span>
          </div>
        </div>

        {/* Players Live Scores Table */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4 divide-y divide-slate-100">
          {players.map((player, idx) => {
            const isMe = player.id === myPlayerId;
            const isAlive = player.status === "alive";
            const weaponMeta = WEAPONS[player.weapon] || WEAPONS.shoe;
            const displayRank = isAlive ? idx + 1 : player.eliminationRank ?? idx + 1;

            return (
              <div
                key={player.id}
                id={`eliminated-view-player-${player.id}`}
                className={`py-2.5 px-3 rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                  isMe
                    ? "bg-rose-50/70 border border-rose-200"
                    : isAlive
                    ? "hover:bg-slate-50"
                    : "opacity-60 bg-slate-50/50"
                }`}
              >
                {/* Left: Rank, Name, Weapon */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isAlive && idx === 0
                        ? "bg-amber-400 text-amber-950 shadow-sm"
                        : isAlive && idx === 1
                        ? "bg-slate-200 text-slate-800"
                        : isAlive && idx === 2
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    #{displayRank}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{weaponMeta.name}</span>
                      <span>•</span>
                      <span className="font-mono">{player.kills} kills</span>
                    </div>
                  </div>
                </div>

                {/* Right: Score and Lives / Status */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="font-mono font-bold text-slate-900 text-base">
                    {player.score.toLocaleString()}{" "}
                    <span className="text-xs text-slate-500 font-sans font-normal">pts</span>
                  </div>

                  {isAlive ? (
                    <div
                      className="flex items-center gap-0.5 text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"
                      title={`${player.lives} lives`}
                    >
                      {Array.from({ length: player.lives }).map((_, hIdx) => (
                        <Heart key={hIdx} className="w-3 h-3 fill-rose-500 text-rose-500" />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200 text-slate-600 font-mono">
                      OUT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Waiting for match to end...
          </div>
          <button
            id="eliminated-exit-menu-btn"
            type="button"
            onClick={onExitToMenu}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
