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
  let gradeColor = "text-sky-700 border-sky-300 bg-sky-50";
  if (stats.score >= 15000 && stats.accuracy >= 85) {
    grade = "SSS";
    gradeColor = "text-amber-700 border-amber-300 bg-amber-50";
  } else if (stats.score >= 10000) {
    grade = "S";
    gradeColor = "text-rose-700 border-rose-300 bg-rose-50";
  } else if (stats.score >= 6000) {
    grade = "A";
    gradeColor = "text-emerald-700 border-emerald-300 bg-emerald-50";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-center p-6 space-y-4 animate-in zoom-in-95 duration-150">
        {/* Grade Stamp */}
        <div className="flex justify-center">
          <div
            className={`w-14 h-14 rounded-xl border flex items-center justify-center font-bold text-2xl shadow-xs ${gradeColor}`}
          >
            {grade}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
            Session Concluded
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Match Results
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Weapon: <strong className="text-slate-800">{activeWeapon.name}</strong> • Peak Pace:{" "}
            <strong className="text-amber-600 font-mono">{topSpeed.toFixed(1)}x</strong>
          </p>
        </div>

        {/* Score Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
            Final Score
          </span>
          <div className="text-4xl font-bold text-slate-900 tracking-tight font-mono my-1">
            {stats.score.toLocaleString()}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono">{stats.kills}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Smashed
              </span>
            </div>
            <div>
              <div className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-sky-500" />
                <span className="font-mono">{stats.accuracy}%</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Accuracy
              </span>
            </div>
            <div>
              <div className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-mono">x{stats.maxCombo}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Combo
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onRestart}
            id="play-again-button"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenShare}
              id="open-share-from-gameover"
              className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share</span>
            </button>

            <button
              onClick={onOpenLeaderboard}
              id="open-leaderboard-from-gameover"
              className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Rankings</span>
            </button>
          </div>

          <button
            onClick={onChangeWeapon}
            id="change-weapon-from-gameover"
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200 shadow-xs"
          >
            <span>Change Weapon / Difficulty</span>
          </button>

          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              id="open-mode-select-from-gameover"
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Main Menu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
