import React from "react";
import { WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { Volume2, VolumeX, RotateCcw, Heart } from "lucide-react";

interface MinimalHudProps {
  score: number;
  kills: number;
  combo: number;
  lives: number;
  maxLives: number;
  speedMultiplier: number;
  weapon: WeaponType;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onChangeWeapon: () => void;
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
  weapon,
  soundEnabled,
  onToggleSound,
  onChangeWeapon,
  roomInfo,
  onExitRoom,
}) => {
  const activeWeapon = WEAPONS[weapon];

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4 flex items-start justify-between">
      {/* Top Left: Compact High-Contrast Score + Room Indicator */}
      <div className="pointer-events-auto flex items-center gap-2">
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

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <span title={`${kills} bugs squashed`} className="flex items-center gap-0.5 text-slate-200">
              <span>🐛</span>
              <span>{kills}</span>
            </span>
            <span className="text-cyan-400 text-[11px] font-bold" title={`Bug speed: ${speedMultiplier.toFixed(1)}x`}>
              {speedMultiplier.toFixed(1)}x
            </span>
          </div>

          {combo > 1 && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black animate-pulse flex items-center gap-0.5">
              <span>🔥</span>
              <span>{combo}x</span>
            </span>
          )}
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

        {/* Weapon Badge & Quick Switch */}
        <button
          type="button"
          onClick={onChangeWeapon}
          id="hud-switch-weapon-btn"
          className="bg-slate-950/75 hover:bg-slate-900 border border-slate-800 p-2 sm:px-3 sm:py-2 rounded-2xl text-white shadow-xl flex items-center gap-1.5 transition-all cursor-pointer"
          title={`Equipped: ${activeWeapon.name}. Click to switch.`}
        >
          <span className="text-base sm:text-lg">{activeWeapon.icon}</span>
          <span className="text-xs font-bold text-slate-300 hidden md:inline">
            {activeWeapon.name}
          </span>
          <RotateCcw className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
        </button>

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
