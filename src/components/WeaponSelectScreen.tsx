import React, { useState, useEffect } from "react";
import { WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { Check, Play, Zap, Crosshair, Sparkles, Trophy } from "lucide-react";

interface WeaponSelectScreenProps {
  onSelectAndStart: (weapon: WeaponType) => void;
  defaultWeapon?: WeaponType;
  highScore: number;
  totalKills: number;
}

export const WeaponSelectScreen: React.FC<WeaponSelectScreenProps> = ({
  onSelectAndStart,
  defaultWeapon = "shoe",
  highScore,
  totalKills,
}) => {
  const [chosenWeapon, setChosenWeapon] = useState<WeaponType>(defaultWeapon);

  const weaponList: WeaponType[] = ["shoe", "newspaper", "swatter"];

  // Keyboard shortcut support for fast loadout selection & start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") setChosenWeapon("shoe");
      if (e.key === "2") setChosenWeapon("newspaper");
      if (e.key === "3") setChosenWeapon("swatter");
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectAndStart(chosenWeapon);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chosenWeapon, onSelectAndStart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 text-white overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Subtle Ambient Header Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/80 text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                Arsenal
              </span>
              <span className="text-xs text-slate-400">Step 1 of 1</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Select Your Weapon
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Choose your pest control tool before entering the floor.
            </p>
          </div>

          {/* Compact Record Tag */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Best:</span>
              <span className="font-bold text-slate-200">{highScore.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="text-slate-400">
              <span>Squashed:</span>{" "}
              <span className="font-bold text-slate-200">{totalKills.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3 Balanced Weapon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
          {weaponList.map((wId, index) => {
            const w = WEAPONS[wId];
            const isSelected = chosenWeapon === wId;

            return (
              <button
                key={wId}
                type="button"
                id={`weapon-card-${wId}`}
                onClick={() => setChosenWeapon(wId)}
                className={`relative flex flex-col text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer group ${
                  isSelected
                    ? "bg-slate-800/90 border-amber-500/90 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
                    : "bg-slate-950/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/40 opacity-90 hover:opacity-100"
                }`}
              >
                {/* Keyboard Shortcut & Selection Pill */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    Key {index + 1}
                  </span>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "border border-slate-700 bg-slate-900/80 group-hover:border-slate-500"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Custom SVG Weapon Illustration Canvas */}
                <div
                  className={`h-24 w-full rounded-xl flex items-center justify-center mb-3 transition-colors border ${
                    isSelected
                      ? "bg-slate-900/90 border-slate-700/70"
                      : "bg-slate-900/50 border-slate-800/50 group-hover:bg-slate-900/70"
                  }`}
                >
                  {wId === "shoe" && (
                    <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
                      {/* Ambient Drop Shadow */}
                      <ellipse cx="50" cy="88" rx="28" ry="6" fill="rgba(0,0,0,0.4)" />
                      {/* Slipper Base Group - rotated slightly for natural presentation */}
                      <g transform="translate(14, 2) scale(0.72)">
                        {/* Outer Dark Red/Terracotta Sole Rim */}
                        <path
                          d="M 50 8 C 30 8, 22 24, 22 46 C 22 62, 26 76, 26 98 C 26 116, 36 124, 50 124 C 64 124, 74 116, 74 98 C 74 76, 78 62, 78 46 C 78 24, 70 8, 50 8 Z"
                          fill="#991b1b"
                          stroke="#7f1d1d"
                          strokeWidth="2.5"
                        />
                        {/* White Sandwich Sole Layer */}
                        <path
                          d="M 50 10 C 32 10, 24 25, 24 46 C 24 62, 28 76, 28 97 C 28 114, 37 122, 50 122 C 63 122, 72 114, 72 97 C 72 76, 76 62, 76 46 C 76 25, 68 10, 50 10 Z"
                          fill="#ffffff"
                        />
                        {/* Coral-Red Footbed */}
                        <path
                          d="M 50 12 C 34 12, 26 26, 26 46 C 26 62, 30 76, 30 96 C 30 112, 38 120, 50 120 C 62 120, 70 112, 70 96 C 70 76, 74 62, 74 46 C 74 26, 66 12, 50 12 Z"
                          fill="#eb5743"
                        />

                        {/* Textured Horizontal Grip Ridges */}
                        {[26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106].map((y) => (
                          <rect
                            key={y}
                            x="36"
                            y={y}
                            width="28"
                            height="3.5"
                            rx="1.75"
                            fill="#f87171"
                            fillOpacity="0.8"
                          />
                        ))}

                        {/* Yellow V-Strap (Thong) */}
                        {/* Left Strap */}
                        <path
                          d="M 50 40 C 44 48, 28 66, 26 78 C 28 78, 32 76, 36 68 C 42 56, 48 46, 50 40 Z"
                          fill="#facc15"
                          stroke="#ca8a04"
                          strokeWidth="1"
                        />
                        {/* Right Strap */}
                        <path
                          d="M 50 40 C 56 48, 72 66, 74 78 C 72 78, 68 76, 64 68 C 58 56, 52 46, 50 40 Z"
                          fill="#facc15"
                          stroke="#ca8a04"
                          strokeWidth="1"
                        />
                        {/* Central V-Strap Joint Cap */}
                        <path
                          d="M 44 46 C 47 39, 53 39, 56 46 C 53 43, 47 43, 44 46 Z"
                          fill="#eab308"
                        />
                        {/* Dark Navy Toe-Post Plug */}
                        <ellipse cx="50" cy="36" rx="3.5" ry="6" fill="#0f172a" />
                        <ellipse cx="50" cy="34" rx="2" ry="3" fill="#1e293b" />
                      </g>
                    </svg>
                  )}

                  {wId === "newspaper" && (
                    <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
                      {/* Ambient Drop Shadow */}
                      <ellipse cx="50" cy="86" rx="32" ry="6" fill="rgba(0,0,0,0.4)" />
                      {/* Angled Newspaper matching user's Image 2 */}
                      <g transform="translate(48, 48) rotate(-38) translate(-46, -46)">
                        {/* Folded back sheets (gray) */}
                        <path
                          d="M 38 10 L 52 2 L 56 34 L 42 42 Z"
                          fill="#cbd5e1"
                          stroke="#000000"
                          strokeWidth="2"
                        />
                        <path
                          d="M 44 8 L 62 14 L 64 48 L 48 44 Z"
                          fill="#e2e8f0"
                          stroke="#000000"
                          strokeWidth="2"
                        />

                        {/* Main Rolled Newspaper Tube */}
                        <path
                          d="M 16 26 L 38 12 L 80 72 L 58 86 Z"
                          fill="#ffffff"
                          stroke="#000000"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />

                        {/* Top Folded Flap with Arched "NEWS" banner */}
                        <path
                          d="M 14 26 C 20 18, 32 14, 40 18 L 36 32 C 28 28, 20 30, 16 34 Z"
                          fill="#ffffff"
                          stroke="#000000"
                          strokeWidth="2.5"
                        />
                        {/* "NEWS" text banner */}
                        <text
                          x="18"
                          y="27"
                          fill="#000000"
                          fontFamily="Impact, Arial Black, sans-serif"
                          fontSize="9"
                          fontWeight="900"
                          letterSpacing="0.5"
                          transform="rotate(-18, 18, 27)"
                        >
                          NEWS
                        </text>

                        {/* Simulated Newspaper Article Columns */}
                        {/* Headline Bar */}
                        <rect x="25" y="32" width="22" height="3" rx="0.5" fill="#334155" />
                        
                        {/* Column 1 text lines */}
                        <line x1="25" y1="38" x2="38" y2="38" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="25" y1="42" x2="36" y2="42" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="25" y1="46" x2="38" y2="46" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="25" y1="50" x2="34" y2="50" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="25" y1="54" x2="37" y2="54" stroke="#64748b" strokeWidth="1.8" />

                        {/* Column 2 text lines */}
                        <line x1="42" y1="36" x2="55" y2="36" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="42" y1="40" x2="53" y2="40" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="42" y1="44" x2="56" y2="44" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="42" y1="48" x2="54" y2="48" stroke="#64748b" strokeWidth="1.8" />
                        <line x1="42" y1="52" x2="52" y2="52" stroke="#64748b" strokeWidth="1.8" />

                        {/* Lower Article Block */}
                        <line x1="36" y1="62" x2="66" y2="62" stroke="#475569" strokeWidth="2" />
                        <line x1="36" y1="67" x2="64" y2="67" stroke="#94a3b8" strokeWidth="1.8" />
                        <line x1="38" y1="71" x2="62" y2="71" stroke="#94a3b8" strokeWidth="1.8" />

                        {/* Rolled Cylinder Bottom Curl */}
                        <path
                          d="M 58 86 C 68 84, 76 78, 80 72"
                          stroke="#000000"
                          strokeWidth="2.5"
                          fill="none"
                        />
                      </g>
                    </svg>
                  )}

                  {wId === "swatter" && (
                    <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
                      {/* Ambient Drop Shadow */}
                      <ellipse cx="50" cy="88" rx="30" ry="5" fill="rgba(0,0,0,0.4)" />
                      {/* Electric Bug Racket matching user's Image 1 */}
                      <g transform="translate(50, 48) rotate(-42) translate(-40, -50)">
                        {/* Yellow Rounded-Rectangular Racket Head */}
                        <rect
                          x="16"
                          y="6"
                          width="48"
                          height="54"
                          rx="16"
                          fill="#eab308"
                          stroke="#ca8a04"
                          strokeWidth="3"
                        />

                        {/* Red/Crimson Inner Grid Background (from Image 1) */}
                        <rect
                          x="22"
                          y="12"
                          width="36"
                          height="42"
                          rx="10"
                          fill="#b91c1c"
                        />

                        {/* Yellow Electric Mesh Grid Lines */}
                        {/* Horizontal Grid Wires */}
                        {[18, 24, 30, 36, 42, 48].map((y) => (
                          <line
                            key={`h-${y}`}
                            x1="22"
                            y1={y}
                            x2="58"
                            y2={y}
                            stroke="#facc15"
                            strokeWidth="2"
                          />
                        ))}
                        {/* Vertical Grid Wires */}
                        {[28, 34, 40, 46, 52].map((x) => (
                          <line
                            key={`v-${x}`}
                            x1={x}
                            y1="12"
                            x2={x}
                            y2="54"
                            stroke="#facc15"
                            strokeWidth="2"
                          />
                        ))}

                        {/* Handle Neck Socket */}
                        <path
                          d="M 34 60 L 46 60 L 44 66 L 36 66 Z"
                          fill="#eab308"
                          stroke="#ca8a04"
                          strokeWidth="1.5"
                        />

                        {/* White Cylindrical Handle Shaft */}
                        <rect
                          x="36"
                          y="66"
                          width="8"
                          height="30"
                          rx="2"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth="1.5"
                        />

                        {/* Yellow Oval Power Switch Button */}
                        <rect
                          x="38"
                          y="76"
                          width="4"
                          height="9"
                          rx="2"
                          fill="#facc15"
                          stroke="#ca8a04"
                          strokeWidth="1"
                        />
                        <circle cx="40" cy="80.5" r="1" fill="#78350f" />

                        {/* Flared Yellow Pommel Base */}
                        <path
                          d="M 33 96 L 47 96 L 45 101 L 35 101 Z"
                          fill="#eab308"
                          stroke="#ca8a04"
                          strokeWidth="1.5"
                        />
                      </g>
                    </svg>
                  )}
                </div>

                {/* Weapon Title & Perk */}
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                    {w.name}
                  </h2>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{w.perk}</span>
                  </div>
                </div>

                {/* Brief Tactical Description */}
                <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">
                  {w.description}
                </p>

                {/* Clean Specs Row */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-slate-400" />
                    <span>Radius:</span>
                    <span className="text-slate-200 font-bold ml-auto">{w.radius}px</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Cooldown:</span>
                    <span className="text-slate-200 font-bold ml-auto">{w.cooldown}ms</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer & Start Game Action */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left flex items-center gap-2">
            <span>Selected:</span>
            <span className="text-white font-bold">{WEAPONS[chosenWeapon].name}</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">1</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">2</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">3</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">Enter</kbd>
            </span>
          </div>

          <button
            type="button"
            id="start-match-with-weapon-button"
            onClick={() => onSelectAndStart(chosenWeapon)}
            className="w-full sm:w-auto px-7 py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-sm tracking-wide rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};
