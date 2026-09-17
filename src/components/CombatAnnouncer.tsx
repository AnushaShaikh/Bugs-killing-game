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
    <div className="absolute top-11 sm:top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex justify-center px-2 select-none">
      <div
        key={latestStrike.id}
        className={`px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-sm flex items-center gap-1.5 transition-all animate-in fade-in zoom-in-95 duration-100 ${
          isCrit
            ? "bg-amber-50/95 border-amber-300 text-amber-900"
            : hasSpeedBonus
            ? "bg-sky-50/95 border-sky-300 text-sky-900"
            : "bg-white/95 border-slate-200 text-slate-800"
        }`}
      >
        {/* Status Icon */}
        <div className="shrink-0">
          {isCrit ? (
            <Target className="w-3 h-3 text-amber-600" />
          ) : hasSpeedBonus ? (
            <Zap className="w-3 h-3 text-sky-600" />
          ) : combo >= 5 ? (
            <Flame className="w-3 h-3 text-rose-500" />
          ) : (
            <Crosshair className="w-3 h-3 text-slate-500" />
          )}
        </div>

        {/* Remark Text */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-bold text-xs uppercase tracking-wide">
            {latestStrike.text}
          </span>
          {latestStrike.subtext && (
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight hidden sm:inline">
              {latestStrike.subtext}
            </span>
          )}
        </div>

        {/* Points Bonus Tag */}
        {latestStrike.scoreBonus > 0 && (
          <span className="text-[10px] font-mono font-bold px-1 rounded bg-slate-100 text-amber-700 border border-slate-200 ml-0.5">
            +{latestStrike.scoreBonus}
          </span>
        )}
      </div>
    </div>
  );
};
