import React from "react";
import { StrikeEffect } from "../types";
import { Zap, Flame, Target, Crosshair } from "lucide-react";

interface CombatAnnouncerProps {
  latestStrike: StrikeEffect | null;
  combo: number;
}

export const CombatAnnouncer: React.FC<CombatAnnouncerProps> = ({ latestStrike, combo }) => {
  if (!latestStrike) return null;

  const isCrit = latestStrike.isCrit;
  const hasSpeedBonus = Boolean(latestStrike.subtext);

  return (
    <div className="absolute top-16 sm:top-[68px] left-1/2 -translate-x-1/2 z-20 pointer-events-none flex justify-center px-2">
      <div
        key={latestStrike.id}
        className={`px-3 py-1 rounded-full border shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all animate-in fade-in zoom-in-95 duration-100 ${
          isCrit
            ? "bg-slate-950/90 border-amber-500/80 text-amber-300 shadow-amber-500/20"
            : hasSpeedBonus
            ? "bg-slate-950/90 border-cyan-500/80 text-cyan-300 shadow-cyan-500/20"
            : "bg-slate-950/85 border-slate-700 text-white"
        }`}
      >
        {/* Compact Combat Status Icon */}
        <div className="p-0.5 rounded-full shrink-0">
          {isCrit ? (
            <Target className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : hasSpeedBonus ? (
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          ) : combo >= 5 ? (
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-slate-300" />
          )}
        </div>

        {/* Remark Text */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-black text-xs uppercase tracking-wide">
            {latestStrike.text}
          </span>
          {latestStrike.subtext && (
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-tight hidden sm:inline">
              {latestStrike.subtext}
            </span>
          )}
        </div>

        {/* Points Bonus Tag */}
        {latestStrike.scoreBonus > 0 && (
          <span className="text-[11px] font-black px-1.5 py-0.5 rounded bg-white/20 text-yellow-300 ml-0.5">
            +{latestStrike.scoreBonus}
          </span>
        )}
      </div>
    </div>
  );
};
