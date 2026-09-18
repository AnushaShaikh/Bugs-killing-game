import React from "react";
import { EliminationNotification } from "../types";

interface EliminationBannerProps {
  notification: EliminationNotification | null;
}

export const EliminationBanner: React.FC<EliminationBannerProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div
      id="elimination-top-popup"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200"
    >
      <div className="bg-slate-900/90 text-white font-semibold px-4 py-2 rounded-full shadow-lg border border-slate-700/60 flex items-center gap-2 select-none text-xs sm:text-sm tracking-normal backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
        <span>
          <strong className="font-bold text-white">{notification.playerName}</strong> is out!
        </span>
      </div>
    </div>
  );
};

