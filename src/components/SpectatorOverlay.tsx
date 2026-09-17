import React from "react";
import { MultiplayerPlayer, SpectatorReaction } from "../types";
import { WEAPONS } from "../data/weapons";
import { Eye, ChevronLeft, ChevronRight, Heart, Trophy, Flame, Zap, Award } from "lucide-react";

interface SpectatorOverlayProps {
  alivePlayers: MultiplayerPlayer[];
  currentSpectatingId: string | null;
  onSelectSpectatingId: (id: string) => void;
  onSendCheer: (emoji: string) => void;
  floatingReactions: SpectatorReaction[];
  myEliminationRank?: number;
}

export const SpectatorOverlay: React.FC<SpectatorOverlayProps> = ({
  alivePlayers,
  currentSpectatingId,
  onSelectSpectatingId,
  onSendCheer,
  floatingReactions,
  myEliminationRank,
}) => {
  const currentIndex = alivePlayers.findIndex((p) => p.id === currentSpectatingId);
  const activeTarget = currentIndex >= 0 ? alivePlayers[currentIndex] : alivePlayers[0] || null;

  const handlePrev = () => {
    if (alivePlayers.length <= 1) return;
    const prevIdx = (currentIndex - 1 + alivePlayers.length) % alivePlayers.length;
    onSelectSpectatingId(alivePlayers[prevIdx].id);
  };

  const handleNext = () => {
    if (alivePlayers.length <= 1) return;
    const nextIdx = (currentIndex + 1) % alivePlayers.length;
    onSelectSpectatingId(alivePlayers[nextIdx].id);
  };

  const CHEER_EMOJIS = ["👏", "🔥", "💥", "👑", "😱", "⚡"];

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4">
      {/* 1. TOP SPECTATOR CONTROLLER BAR */}
      <div className="w-full max-w-2xl mx-auto pointer-events-auto bg-slate-900/90 backdrop-blur-md border-2 border-indigo-500/60 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: Live Spectating Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 rounded-full text-[10px] font-black tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>SPECTATING</span>
          </div>
          {myEliminationRank && (
            <span className="text-[11px] font-bold text-slate-400">
              Your Rank: <strong className="text-amber-400">#{myEliminationRank}</strong>
            </span>
          )}
        </div>

        {/* Center: Spectated Player Switcher */}
        {activeTarget ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={alivePlayers.length <= 1}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              title="Previous player"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/90 rounded-xl border border-slate-700">
              <span className="text-xl">
                {WEAPONS[activeTarget.weapon]?.icon || "👞"}
              </span>
              <div className="text-left">
                <div className="text-xs font-black text-amber-300 leading-tight">
                  {activeTarget.name}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-0.5 text-red-400 font-bold">
                    <Heart className="w-3 h-3 fill-current" />
                    {activeTarget.lives} lives
                  </span>
                  <span>•</span>
                  <span>{activeTarget.score.toLocaleString()} pts</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={alivePlayers.length <= 1}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
              title="Next player"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Waiting for survivors...</div>
        )}

        {/* Right: Remaining Alive Count */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Alive
          </span>
          <span className="text-sm font-black text-emerald-400">
            {alivePlayers.length} remaining
          </span>
        </div>
      </div>

      {/* 2. FLOATING REACTION EMOJIS (Animated on canvas) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-20 left-1/2 text-3xl animate-in slide-in-from-bottom-12 fade-in duration-1000 -translate-x-1/2"
            style={{
              left: `${reaction.x ?? 50}%`,
              animation: "floatUp 1.8s ease-out forwards",
            }}
          >
            <div className="flex flex-col items-center">
              <span>{reaction.emoji}</span>
              <span className="text-[10px] font-black text-white/80 bg-black/50 px-1.5 py-0.2 rounded mt-0.5">
                {reaction.fromName}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. BOTTOM SPECTATOR CHEER BAR */}
      <div className="w-full max-w-md mx-auto pointer-events-auto bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider pl-1">
          Cheer on Friends:
        </span>
        <div className="flex items-center gap-1.5">
          {CHEER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendCheer(emoji)}
              className="p-1.5 sm:px-2.5 sm:py-1 bg-slate-800 hover:bg-indigo-600 active:scale-95 rounded-xl text-lg sm:text-base transition-all"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
