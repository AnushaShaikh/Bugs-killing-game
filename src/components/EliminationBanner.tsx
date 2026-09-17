import React from "react";
import { EliminationNotification } from "../types";
import { Skull, AlertTriangle, Users } from "lucide-react";

interface EliminationBannerProps {
  notification: EliminationNotification | null;
}

export const EliminationBanner: React.FC<EliminationBannerProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-6 duration-300">
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-5 py-2.5 rounded-2xl shadow-2xl shadow-red-950/60 border-2 border-red-300/40 flex items-center gap-3 select-none">
        <div className="p-1.5 bg-black/30 rounded-xl">
          <Skull className="w-5 h-5 text-red-200 animate-pulse" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wide uppercase text-red-100">
              Player Knocked Out
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black/40 text-amber-300">
              Rank #{notification.rank}
            </span>
          </div>
          <div className="text-sm font-extrabold text-white">
            <span className="text-amber-200">{notification.playerName}</span> was eliminated!
          </div>
        </div>
        <div className="pl-3 border-l border-red-400/40 text-right">
          <div className="flex items-center gap-1 text-[11px] font-bold text-red-100">
            <Users className="w-3.5 h-3.5" />
            <span>{notification.remainingAlive} Alive</span>
          </div>
        </div>
      </div>
    </div>
  );
};
