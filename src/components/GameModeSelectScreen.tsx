import React, { useState } from "react";
import { PlayModeChoice, UserProfile, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { User, Users, Shield, Trophy, ChevronRight, Edit2, Check } from "lucide-react";

interface GameModeSelectScreenProps {
  profile: UserProfile;
  selectedWeapon: WeaponType;
  onUpdateName: (name: string) => void;
  onChangeWeapon: () => void;
  onSelectMode: (mode: PlayModeChoice) => void;
}

export const GameModeSelectScreen: React.FC<GameModeSelectScreenProps> = ({
  profile,
  selectedWeapon,
  onUpdateName,
  onChangeWeapon,
  onSelectMode,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const weapon = WEAPONS[selectedWeapon] || WEAPONS.shoe;

  const handleSaveName = () => {
    const trimmed = tempName.trim().slice(0, 14);
    if (trimmed) {
      onUpdateName(trimmed);
    } else {
      setTempName(profile.name);
    }
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none overflow-y-auto">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center my-auto">
        {/* Category Label */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium mb-3">
          <span>Household Arcade</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Bug Whacker
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mt-1 mb-6">
          Defend the kitchen floor from crawling pests. Choose solo survival or host a multiplayer match for friends.
        </p>

        {/* Player Profile & Active Loadout */}
        <div className="w-full bg-slate-50 border border-slate-200/90 rounded-xl p-3 mb-5 flex items-center justify-between gap-3 text-left">
          {/* Player Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Player
              </span>
              {isEditingName ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    maxLength={14}
                    autoFocus
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 w-28"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs transition-colors cursor-pointer"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="group flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
                  title="Click to rename"
                >
                  <span>{profile.name}</span>
                  <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                </button>
              )}
            </div>
          </div>

          {/* Active Weapon Pill */}
          <button
            onClick={onChangeWeapon}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all group shadow-xs cursor-pointer"
            title="Change active weapon"
          >
            <span className="text-base">{weapon.icon}</span>
            <div className="text-left">
              <span className="text-[9px] uppercase font-medium text-slate-400 block leading-tight">
                Weapon
              </span>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                {weapon.name}
              </span>
            </div>
          </button>
        </div>

        {/* Game Mode Selection Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: Single Player */}
          <button
            onClick={() => onSelectMode("single")}
            id="mode-select-single-player"
            className="group bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition-all flex flex-col justify-between shadow-xs cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-600 mb-3 shadow-xs">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Single Player
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200/70 text-slate-600">
                  Solo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Classic solo pest elimination. 3 survival lives, precision combo multipliers, and personal records.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Best: <strong className="text-slate-800 font-semibold">{profile.highScore.toLocaleString()}</strong></span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 group-hover:translate-x-0.5 transition-transform">
                <span>Play</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>

          {/* Card 2: Play in a Room (Multiplayer) */}
          <button
            onClick={() => onSelectMode("room")}
            id="mode-select-room-multiplayer"
            className="group bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl p-4 text-left transition-all flex flex-col justify-between shadow-xs cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  Multiplayer Room
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Up to 12
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Host a room or enter a code to compete with friends. Last player standing wins the match.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Real-time Battle
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                <span>Join / Host</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
