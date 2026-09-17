import React, { useEffect } from "react";
import { GameStats, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { Trophy, RefreshCw, Share2, Award, Zap, Crosshair, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  weapon: WeaponType;
  topSpeed?: number;
  onRestart: () => void;
  onChangeWeapon: () => void;
  onOpenShare: () => void;
  onOpenLeaderboard: () => void;
  onBackToMenu?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  weapon,
  topSpeed = 1.0,
  onRestart,
  onChangeWeapon,
  onOpenShare,
  onOpenLeaderboard,
  onBackToMenu,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeWeapon = WEAPONS[weapon] || WEAPONS.shoe;

  // Grade calculation
  let grade = "B";
  let gradeColor = "text-blue-500 border-blue-400";
  if (stats.score >= 15000 && stats.accuracy >= 85) {
    grade = "SSS";
    gradeColor = "text-amber-500 border-amber-400";
  } else if (stats.score >= 10000) {
    grade = "S";
    gradeColor = "text-rose-500 border-rose-400";
  } else if (stats.score >= 6000) {
    grade = "A";
    gradeColor = "text-emerald-500 border-emerald-400";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-slate-900 overflow-hidden text-center p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Cartoon Grade Stamp */}
        <div className="flex justify-center">
          <div
            className={`w-20 h-20 rounded-3xl border-4 flex items-center justify-center font-black text-4xl shadow-lg rotate-6 ${gradeColor} bg-slate-50`}
          >
            {grade}
          </div>
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-rose-500">
            ALL 3 LIVES LOST — GAME OVER!
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Infestation Overrun!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Weapon: <strong>{activeWeapon.name}</strong> {activeWeapon.icon} • Top Speed Reached:{" "}
            <strong className="text-amber-600">{topSpeed.toFixed(1)}x</strong>
          </p>
        </div>

        {/* Big Score Box */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Final Score
          </span>
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {stats.score.toLocaleString()}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{stats.kills}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Bugs Smashed
              </span>
            </div>
            <div>
              <div className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-blue-500" />
                <span>{stats.accuracy}%</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Accuracy
              </span>
            </div>
            <div>
              <div className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-rose-500" />
                <span>x{stats.maxCombo}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Max Combo
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onRestart}
            id="play-again-button"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Smash Again</span>
          </button>

          <button
            onClick={onChangeWeapon}
            id="change-weapon-from-gameover"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
          >
            <span>Switch Weapon Arsenal</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenShare}
              id="open-share-from-gameover"
              className="py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Score</span>
            </button>

            <button
              onClick={onOpenLeaderboard}
              id="open-leaderboard-from-gameover"
              className="py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </button>
          </div>

          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              id="open-mode-select-from-gameover"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Main Menu / Switch to Multiplayer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
