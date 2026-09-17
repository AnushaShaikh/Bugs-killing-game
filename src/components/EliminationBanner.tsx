import React from "react";
import { EliminationNotification } from "../types";
import { Skull, AlertTriangle, Users } from "lucide-react";

interface EliminationBannerProps {
  notification: EliminationNotification | null;
}

export const EliminationBanner: React.FC<EliminationBannerProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-white/95 text-slate-900 px-4 py-2 rounded-xl shadow-xl border border-slate-200 flex items-center gap-3 select-none backdrop-blur-sm">
        <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg">
          <Skull className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-600">
              Player Knocked Out
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Rank #{notification.rank}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900">
            <span className="text-slate-900 font-bold">{notification.playerName}</span> was eliminated
          </div>
        </div>
        <div className="pl-2.5 border-l border-slate-200 text-right">
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <Users className="w-3 h-3" />
            <span className="font-mono">{notification.remainingAlive} alive</span>
          </div>
        </div>
      </div>
    </div>
  );
};
