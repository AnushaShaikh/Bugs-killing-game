import React from "react";
import { DifficultyLevel, WeaponType } from "../types";
import { Volume2, VolumeX, Heart, ArrowLeft, ShieldAlert } from "lucide-react";

interface MinimalHudProps {
  score: number;
  kills: number;
  combo: number;
  lives: number;
  maxLives: number;
  speedMultiplier: number;
  difficulty?: DifficultyLevel;
  penaltyNotice?: string | null;
  weapon?: WeaponType;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBackToMenu?: () => void;
  roomInfo?: {
    roomId: string;
    aliveCount: number;
    totalPlayers: number;
    isSpectating?: boolean;
  } | null;
  onExitRoom?: () => void;
}

export const MinimalHud: React.FC<MinimalHudProps> = ({
  score,
  kills,
  combo,
  lives,
  maxLives,
  speedMultiplier,
  difficulty = "easy",
  penaltyNotice,
  soundEnabled,
  onToggleSound,
  onBackToMenu,
  roomInfo,
}) => {

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4 flex items-start justify-between">
      {/* Top Left: Compact High-Contrast Score + Room Indicator + Back to Menu Button */}
      <div className="pointer-events-auto flex items-center gap-2">
        {onBackToMenu && (
          <button
            type="button"
            onClick={onBackToMenu}
            id="hud-back-to-menu-btn"
            className="bg-slate-950/85 hover:bg-slate-900 border border-slate-700 hover:border-indigo-400 px-3 py-1.5 sm:py-2 rounded-2xl text-slate-200 hover:text-white shadow-xl flex items-center gap-1.5 transition-all cursor-pointer font-black text-xs group"
            title="Back to Game Mode Selection (Switch to Multiplayer)"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}

        <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-white shadow-xl flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              SCORE
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400 tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1 text-xs font-bold text-slate-300" title={`${kills} bugs squashed`}>
            <span>🐛</span>
            <span>{kills}</span>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div
          className={`backdrop-blur-md px-2.5 py-1.5 rounded-2xl border shadow-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
            difficulty === "expert"
              ? "bg-rose-950/80 border-rose-600/70 text-rose-300"
              : difficulty === "hard"
              ? "bg-amber-950/80 border-amber-500/70 text-amber-300"
              : "bg-slate-950/80 border-slate-800 text-emerald-400"
          }`}
          title={
            difficulty === "expert"
              ? "Expert: 2.5x Speed, 2x Bugs, None Can Escape, Protect Butterflies!"
              : difficulty === "hard"
              ? "Hard: 1.75x Speed (+0.75), Protect Butterflies (-1 life if killed)!"
              : "Easy: Standard Game"
          }
        >
          <span>{difficulty === "expert" ? "🔥" : difficulty === "hard" ? "⚡" : "🟢"}</span>
          <span>{difficulty}</span>
          {difficulty !== "easy" && <span className="text-[10px] text-amber-300/80 normal-case">🦋 safe</span>}
        </div>

        {/* Room Info Badge (If in a multiplayer room) */}
        {roomInfo && (
          <div className="bg-indigo-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-indigo-500/40 text-white shadow-xl flex items-center gap-2 text-xs font-black">
            <span className="text-indigo-300 uppercase text-[10px] tracking-wide">
              ROOM: {roomInfo.roomId}
            </span>
            <div className="h-3 w-px bg-indigo-500/40" />
            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {roomInfo.aliveCount}/{roomInfo.totalPlayers} Alive
            </span>
          </div>
        )}
      </div>

      {/* Floating Penalty Notice Warning */}
      {penaltyNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-bounce">
          <div className="bg-rose-600 text-white font-black px-4 py-2 rounded-2xl shadow-2xl border-2 border-rose-300 flex items-center gap-2 text-xs sm:text-sm tracking-wide uppercase">
            <ShieldAlert className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>{penaltyNotice}</span>
          </div>
        </div>
      )}

      {/* Top Right: Lives (Miss Indicator) & Controls */}
      <div className="pointer-events-auto flex items-center gap-2">

        {/* Lives / Misses Pill */}
        <div
          className={`bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-2xl border flex items-center gap-1.5 shadow-xl transition-all ${
            lives === 0
              ? "border-rose-600 text-rose-300 bg-rose-950/80"
              : lives === 1
              ? "border-rose-500 text-rose-400 animate-pulse bg-rose-950/50"
              : "border-slate-800 text-slate-300"
          }`}
          title="Don't miss a bug! 3 Misses = Game Over"
        >
          <span className="text-[10px] font-black uppercase tracking-wider mr-1">
            {lives === 0 ? "GAME OVER" : lives === 1 ? "LAST CHANCE" : "LIVES"}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxLives }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-4 h-4 transition-all ${
                  idx < lives
                    ? "fill-rose-500 text-rose-500 scale-100 drop-shadow-[0_0_4px_rgba(244,63,94,0.7)]"
                    : "fill-transparent text-slate-700 scale-90"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          id="hud-sound-toggle-btn"
          className="bg-slate-950/75 hover:bg-slate-900 border border-slate-800 p-2 sm:p-2.5 rounded-2xl text-slate-300 shadow-xl transition-all cursor-pointer"
          title={soundEnabled ? "Mute" : "Unmute"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>
    </div>
  );
};
