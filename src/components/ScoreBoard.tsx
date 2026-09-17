import React from "react";
import { GameStats, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { Volume2, VolumeX, Trophy, Users, RefreshCw, Zap, Crosshair, Cloud, RotateCcw } from "lucide-react";

interface ScoreBoardProps {
  stats: GameStats;
  selectedWeapon: WeaponType;
  onChangeWeaponRequest: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenLeaderboard: () => void;
  onOpenMultiplayer: () => void;
  onOpenSync: () => void;
  onRestart: () => void;
  isMultiplayerActive?: boolean;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  stats,
  selectedWeapon,
  onChangeWeaponRequest,
  soundEnabled,
  onToggleSound,
  onOpenLeaderboard,
  onOpenMultiplayer,
  onOpenSync,
  onRestart,
  isMultiplayerActive = false,
}) => {
  const activeWeapon = WEAPONS[selectedWeapon];

  return (
    <header className="relative z-30 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-2 sm:pt-3 pb-1">
      {/* Top Bar: Clean modern tile-matching card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 sm:p-3.5 shadow-xl text-white flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🪰</span>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight">
                BUG WHACKER
              </h1>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Infestation Zone
              </span>
            </div>
          </div>

          {/* Time Remaining Pill */}
          <div
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border font-black text-xs sm:text-sm flex items-center gap-1.5 transition-colors ${
              stats.timeLeft <= 10
                ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                : "bg-slate-800 border-slate-700 text-slate-200"
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Time</span>
            <span>{stats.timeLeft}s</span>
          </div>

          {/* Equipped Weapon Pill (Locked during match) */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <span className="text-base">{activeWeapon.icon}</span>
            <div className="leading-tight">
              <span className="font-extrabold text-white text-[11px] block">{activeWeapon.name}</span>
              <span className="text-[9px] text-amber-400 font-semibold">{activeWeapon.perk}</span>
            </div>
            <button
              onClick={onChangeWeaponRequest}
              className="ml-1 text-[10px] text-slate-400 hover:text-white underline"
              title="Change weapon"
            >
              Change
            </button>
          </div>
        </div>

        {/* Center: Score & Combo Fever */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Main Score Display */}
          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Score
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight leading-none">
              {stats.score.toLocaleString()}
            </div>
          </div>

          {/* Bug Kills & Accuracy */}
          <div className="hidden xs:flex flex-col text-left pl-3 border-l border-slate-700/80 text-xs text-slate-300 font-bold">
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.kills} Squashed</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>{stats.accuracy}% Accuracy</span>
            </div>
          </div>

          {/* Combo Multiplier Badge */}
          {stats.combo > 1 && (
            <div
              className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black border animate-bounce flex items-center gap-1 ${
                stats.combo >= 6
                  ? "bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                  : "bg-slate-800 text-amber-300 border-amber-500/50"
              }`}
            >
              <span>🔥</span>
              <span>x{stats.combo} STREAK</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Change Weapon Mobile */}
          <button
            onClick={onChangeWeaponRequest}
            id="change-weapon-header-btn"
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
            title="Choose different weapon"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Weapon</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onOpenSync}
            id="sync-progress-button"
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
            title="Cross-Device Progress Sync"
          >
            <Cloud className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Sync</span>
          </button>

          {/* Multiplayer Button */}
          <button
            onClick={onOpenMultiplayer}
            id="multiplayer-lobby-button"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              isMultiplayerActive
                ? "bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-400 animate-pulse"
                : "bg-indigo-950/70 hover:bg-indigo-900 border-indigo-700 text-indigo-300"
            }`}
            title="Multiplayer Head-to-Head Duel"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">VS Friends</span>
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            id="leaderboard-button"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Global Rankings"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Rankings</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            id="sound-toggle-button"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            id="restart-round-button"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Restart Match"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
