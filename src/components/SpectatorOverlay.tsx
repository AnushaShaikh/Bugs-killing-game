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
  onOpenLeaderboard?: () => void;
}

export const SpectatorOverlay: React.FC<SpectatorOverlayProps> = ({
  alivePlayers,
  currentSpectatingId,
  onSelectSpectatingId,
  onSendCheer,
  floatingReactions,
  myEliminationRank,
  onOpenLeaderboard,
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
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 select-none">
      {/* 1. TOP SPECTATOR CONTROLLER BAR */}
      <div className="w-full max-w-2xl mx-auto pointer-events-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-slate-900">
        {/* Left: Live Spectating Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-[10px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Spectating</span>
          </div>
          {myEliminationRank && (
            <span className="text-xs font-medium text-slate-500">
              Rank <strong className="text-slate-900 font-mono">#{myEliminationRank}</strong>
            </span>
          )}
        </div>

        {/* Center: Spectated Player Switcher */}
        {activeTarget ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={alivePlayers.length <= 1}
              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer text-slate-700 border border-slate-200"
              title="Previous player"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-base">
                {WEAPONS[activeTarget.weapon]?.icon || "👞"}
              </span>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {activeTarget.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="flex items-center gap-0.5 text-rose-600 font-medium">
                    <Heart className="w-2.5 h-2.5 fill-current" />
                    {activeTarget.lives}
                  </span>
                  <span>•</span>
                  <span className="font-mono">{activeTarget.score.toLocaleString()} pts</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={alivePlayers.length <= 1}
              className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors cursor-pointer text-slate-700 border border-slate-200"
              title="Next player"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Waiting for survivors...</div>
        )}

        {/* Right: Remaining Alive Count + Standings button */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[9px] uppercase font-medium text-slate-400 block">
              Alive
            </span>
            <span className="text-xs font-bold text-emerald-600 font-mono">
              {alivePlayers.length} left
            </span>
          </div>

          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              title="View Match Standings"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Standings</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. FLOATING REACTION EMOJIS (Animated on canvas) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute bottom-20 left-1/2 text-2xl animate-in slide-in-from-bottom-12 fade-in duration-1000 -translate-x-1/2"
            style={{
              left: `${reaction.x ?? 50}%`,
              animation: "floatUp 1.8s ease-out forwards",
            }}
          >
            <div className="flex flex-col items-center">
              <span>{reaction.emoji}</span>
              <span className="text-[9px] font-medium text-slate-700 bg-white/95 px-1.5 py-0.5 rounded mt-0.5 border border-slate-200 shadow-xs">
                {reaction.fromName}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. BOTTOM SPECTATOR CHEER BAR */}
      <div className="w-full max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-2 shadow-lg flex items-center justify-between gap-2 text-slate-700">
        <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider pl-1">
          Cheer:
        </span>
        <div className="flex items-center gap-1">
          {CHEER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendCheer(emoji)}
              className="p-1 sm:px-2 sm:py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg text-base transition-colors cursor-pointer border border-slate-200"
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
