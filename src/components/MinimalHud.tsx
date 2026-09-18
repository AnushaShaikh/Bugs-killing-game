import React from "react";
import { DifficultyLevel, WeaponType } from "../types";
import { Volume2, VolumeX, Heart, ArrowLeft, ShieldAlert, Trophy } from "lucide-react";

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
  onOpenLeaderboard?: () => void;
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
  onOpenLeaderboard,
  roomInfo,
}) => {

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none pt-2 pb-1 px-2 sm:pt-3 sm:px-4 flex items-center justify-between gap-2 select-none">
      {/* 1. Top Left: Menu Button & Standings */}
      <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
        {onBackToMenu && (
          <button
            type="button"
            onClick={onBackToMenu}
            id="hud-back-to-menu-btn"
            className="bg-white/90 hover:bg-white active:bg-slate-100 border border-slate-200/90 h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg text-slate-700 hover:text-slate-900 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-medium backdrop-blur-md"
            title="Return to Menu"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}

        {onOpenLeaderboard && (
          <button
            type="button"
            onClick={onOpenLeaderboard}
            id="hud-leaderboard-btn"
            className="bg-white/90 hover:bg-white active:bg-slate-100 border border-slate-200/90 h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg text-slate-700 hover:text-slate-900 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-medium backdrop-blur-md"
            title="View Standings / Leaderboard"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Standings</span>
          </button>
        )}
      </div>

      {/* 2. Top Center: Unified Score, Kills, and Mode Pill */}
      <div className="pointer-events-auto flex items-center gap-1.5 shrink min-w-0">
        <div className="bg-white/90 backdrop-blur-md h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg border border-slate-200/90 text-slate-700 shadow-xs flex items-center gap-2 sm:gap-3 text-xs">
          {/* Score */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Score
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums tracking-tight">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-200 shrink-0" />

          {/* Kills */}
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600" title={`${kills} pests eliminated`}>
            <span className="text-slate-400 font-medium text-[10px] hidden sm:inline">Kills</span>
            <span className="font-semibold text-slate-900 tabular-nums">{kills}</span>
            <span className="text-[10px] text-slate-400 sm:hidden">k</span>
          </div>

          <div className="h-3 w-px bg-slate-200 shrink-0" />

          {/* Difficulty indicator */}
          <div
            className={`flex items-center gap-1 text-[10px] font-semibold capitalize ${
              difficulty === "expert"
                ? "text-rose-600"
                : difficulty === "hard"
                ? "text-amber-600"
                : "text-emerald-600"
            }`}
            title={`Difficulty: ${difficulty}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                difficulty === "expert"
                  ? "bg-rose-500"
                  : difficulty === "hard"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span className="hidden xs:inline sm:inline">{difficulty}</span>
          </div>

          {/* Room Info (if multiplayer) */}
          {roomInfo && (
            <>
              <div className="h-3 w-px bg-slate-200 shrink-0" />
              <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{roomInfo.aliveCount}/{roomInfo.totalPlayers}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Penalty Notice Warning */}
      {penaltyNotice && (
        <div className="absolute top-11 sm:top-13 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-white/95 text-rose-600 border border-rose-300 px-3 py-1 rounded-lg shadow-lg flex items-center gap-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{penaltyNotice}</span>
          </div>
        </div>
      )}

      {/* 3. Top Right: Lives & Audio Toggle */}
      <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
        {/* Lives Indicator */}
        <div
          className={`bg-white/90 backdrop-blur-md h-8 sm:h-9 px-2 sm:px-2.5 rounded-lg border flex items-center gap-1 sm:gap-1.5 shadow-xs transition-colors ${
            lives === 0
              ? "border-rose-300 text-rose-600 bg-rose-50/90"
              : lives === 1
              ? "border-amber-300 text-amber-600 bg-amber-50/90"
              : "border-slate-200/90 text-slate-600"
          }`}
          title="Lives Remaining"
        >
          <div className="flex items-center gap-0.5 sm:gap-1">
            {Array.from({ length: maxLives }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-3.5 h-3.5 transition-all ${
                  idx < lives
                    ? "fill-rose-500 text-rose-500"
                    : "fill-transparent text-slate-200"
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
          className="bg-white/90 hover:bg-white active:bg-slate-100 border border-slate-200/90 h-8 sm:h-9 w-8 sm:w-9 rounded-lg text-slate-600 hover:text-slate-900 shadow-xs flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
          title={soundEnabled ? "Mute" : "Unmute"}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
};
