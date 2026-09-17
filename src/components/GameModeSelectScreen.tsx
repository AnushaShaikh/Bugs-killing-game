import React, { useState } from "react";
import { PlayModeChoice, UserProfile, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { User, Users, Swords, Shield, Trophy, Sparkles, ChevronRight, Edit2, Check } from "lucide-react";

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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 flex flex-col items-center text-center my-auto">
        {/* App Title & Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-black tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cartoon Household Smash</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          BUG WHACKER
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mt-1 mb-6">
          Choose your game mode before entering the kitchen arena. Play solo to beat your high score or host a room for up to 12 friends!
        </p>

        {/* Player Profile & Loadout Bar */}
        <div className="w-full max-w-lg bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-3 text-left">
          {/* Player Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Player Profile
              </span>
              {isEditingName ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    maxLength={14}
                    autoFocus
                    className="px-2 py-0.5 bg-slate-900 border border-indigo-500 rounded text-xs font-black text-white focus:outline-none w-28"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="group flex items-center gap-1.5 text-sm font-black text-white hover:text-indigo-300 transition-colors"
                  title="Click to rename"
                >
                  <span>{profile.name}</span>
                  <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                </button>
              )}
            </div>
          </div>

          {/* Chosen Weapon & Loadout Button */}
          <button
            onClick={onChangeWeapon}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all group"
            title="Change active weapon"
          >
            <span className="text-xl">{weapon.icon}</span>
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                Weapon
              </span>
              <span className="text-xs font-black text-amber-300 group-hover:text-white transition-colors">
                {weapon.name}
              </span>
            </div>
          </button>
        </div>

        {/* Game Mode Selection Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Single Player */}
          <button
            onClick={() => onSelectMode("single")}
            id="mode-select-single-player"
            className="group relative bg-gradient-to-b from-slate-800 to-slate-800/90 hover:from-slate-750 hover:to-slate-800 border-2 border-slate-700 hover:border-amber-500/80 rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  Single Player
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 uppercase">
                  Classic
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Classic solo pest control. 3 survival lives, combo multipliers, speed ramp-ups, and global high score pursuit.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Best: <strong className="text-white">{profile.highScore.toLocaleString()}</strong></span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Play Solo</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Card 2: Play in a Room (Multiplayer) */}
          <button
            onClick={() => onSelectMode("room")}
            id="mode-select-room-multiplayer"
            className="group relative bg-gradient-to-b from-indigo-950/40 via-slate-800 to-slate-800/90 hover:from-indigo-900/50 hover:to-slate-800 border-2 border-indigo-500/50 hover:border-indigo-400 rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-0.5 flex flex-col justify-between"
          >
            {/* "Up to 12 Players" Badge */}
            <div className="absolute top-3.5 right-3.5">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500 text-white tracking-wide uppercase shadow-sm">
                Up to 12 Players
              </span>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                Play in a Room
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Join with a code or create your own room for friends. Battle Royale rules: eliminated players spectate live, and the last player standing wins!
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Swords className="w-3.5 h-3.5 text-indigo-400" />
                <span>Last Player Standing</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-black text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Join / Create</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
