import React from "react";
import { WeaponType } from "../types";

interface WeaponVisualProps {
  weapon: WeaponType;
  isAttacking: boolean;
  targetPos: { x: number; y: number } | null;
  arenaDimensions: { width: number; height: number };
  isGhost?: boolean;
  playerName?: string;
}

export const WeaponVisual: React.FC<WeaponVisualProps> = ({
  weapon,
  isAttacking,
  targetPos,
  arenaDimensions,
  isGhost = false,
  playerName,
}) => {
  // Base anchor point: bottom right-center of the arena
  const baseX = isGhost ? arenaDimensions.width * 0.25 : arenaDimensions.width * 0.65;
  const baseY = arenaDimensions.height + 40;

  // Calculate angle and extension distance if attacking
  let currentX = baseX;
  let currentY = baseY - 60;
  let angle = -25;
  let armLength = 180;

  if (isAttacking && targetPos) {
    // Thrust arm directly to the target hit point!
    const dx = targetPos.x - baseX;
    const dy = targetPos.y - baseY;
    currentX = targetPos.x;
    currentY = targetPos.y;
    angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    armLength = Math.hypot(dx, dy);
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden z-30 ${
        isGhost ? "opacity-70" : "opacity-100"
      }`}
    >
      {/* SVG Canvas for drawing the extending arm and speed lines */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none">
        <defs>
          <linearGradient id="armSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a373" />
            <stop offset="100%" stopColor="#b07d56" />
          </linearGradient>
          <linearGradient id="sleeve" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
        </defs>

        {/* Dynamic Speed Lines during high-speed strike */}
        {isAttacking && targetPos && (
          <g opacity="0.65">
            <line
              x1={baseX - 30}
              y1={baseY}
              x2={targetPos.x - 15}
              y2={targetPos.y}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="12 8"
            />
            <line
              x1={baseX + 30}
              y1={baseY}
              x2={targetPos.x + 15}
              y2={targetPos.y}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="12 8"
            />
            <line
              x1={baseX}
              y1={baseY}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke="#fbbf24"
              strokeWidth="3"
              strokeDasharray="20 10"
            />
          </g>
        )}

        {/* Extending Arm from Base to Weapon Hand */}
        <g
          style={{
            transformOrigin: `${baseX}px ${baseY}px`,
            transition: isAttacking
              ? "all 0.07s cubic-bezier(0.1, 0.9, 0.2, 1)"
              : "all 0.14s cubic-bezier(0.3, 0, 0.8, 0.15)",
          }}
        >
          {/* Forearm segment */}
          <path
            d={`M ${baseX - 32} ${baseY} Q ${ (baseX + currentX) / 2 } ${ (baseY + currentY) / 2 } ${currentX - 16} ${currentY + 20} L ${currentX + 16} ${currentY + 20} Q ${ (baseX + currentX) / 2 + 10 } ${ (baseY + currentY) / 2 } ${baseX + 32} ${baseY} Z`}
            fill="url(#armSkin)"
            stroke="#78350f"
            strokeWidth="1.5"
          />
          {/* Rolled tactical sleeve at base */}
          <ellipse cx={baseX} cy={baseY - 10} rx="36" ry="16" fill="url(#sleeve)" stroke="#09090b" strokeWidth="2" />
        </g>
      </svg>

      {/* The Weapon and Gripping Hand positioned at currentX, currentY */}
      <div
        className="absolute pointer-events-none will-change-transform"
        style={{
          left: `${currentX}px`,
          top: `${currentY}px`,
          transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${isAttacking ? 1.08 : 0.95})`,
          transition: isAttacking
            ? "all 0.07s cubic-bezier(0.1, 0.9, 0.2, 1)"
            : "all 0.14s cubic-bezier(0.3, 0, 0.8, 0.15)",
        }}
      >
        {/* Opponent name tag if in multiplayer */}
        {isGhost && playerName && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded shadow">
            {playerName}
          </div>
        )}

        {/* 1. Heavy Combat Slipper - Thick reinforced rubber sole with grip lugs */}
        {weapon === "shoe" && (
          <div className="relative w-28 h-40 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)]">
            <svg viewBox="0 0 100 140" className="w-full h-full">
              {/* Rugged Black Rubber Tread Base */}
              <path
                d="M 50 8 C 76 8, 88 32, 88 68 C 88 102, 78 134, 50 134 C 22 134, 12 102, 12 68 C 12 32, 24 8, 50 8 Z"
                fill="#09090b"
                stroke="#18181b"
                strokeWidth="2.5"
              />
              {/* Deep Red Combat Insole */}
              <path
                d="M 50 13 C 71 13, 82 35, 82 68 C 82 98, 73 128, 50 128 C 27 128, 18 98, 18 68 C 18 35, 29 13, 50 13 Z"
                fill="#991b1b"
              />
              {/* Tough Grip Ribs */}
              <line x1="28" y1="40" x2="72" y2="40" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />
              <line x1="24" y1="58" x2="76" y2="58" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />
              <line x1="26" y1="76" x2="74" y2="76" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />
              <line x1="30" y1="94" x2="70" y2="94" stroke="#7f1d1d" strokeWidth="4" strokeLinecap="round" />

              {/* Heavy Duty Strap */}
              <path
                d="M 18 55 C 18 35, 82 35, 82 55 C 82 70, 18 70, 18 55 Z"
                fill="#18181b"
                stroke="#27272a"
                strokeWidth="3"
              />
              {/* Metal Rivet Studs */}
              <circle cx="24" cy="55" r="4" fill="#a1a1aa" stroke="#52525b" strokeWidth="1.5" />
              <circle cx="76" cy="55" r="4" fill="#a1a1aa" stroke="#52525b" strokeWidth="1.5" />

              {/* Hand Clenched Gripping the Slipper */}
              <g id="hand-grip" transform="translate(30, 95)">
                {/* Knuckles & Fingers */}
                <rect x="0" y="0" width="40" height="24" rx="8" fill="#d4a373" stroke="#78350f" strokeWidth="2" />
                <line x1="10" y1="0" x2="10" y2="24" stroke="#78350f" strokeWidth="1.5" />
                <line x1="20" y1="0" x2="20" y2="24" stroke="#78350f" strokeWidth="1.5" />
                <line x1="30" y1="0" x2="30" y2="24" stroke="#78350f" strokeWidth="1.5" />
                {/* Thumb */}
                <ellipse cx="4" cy="8" rx="6" ry="10" fill="#d4a373" stroke="#78350f" strokeWidth="1.5" />
              </g>

              {/* Impact shock ring on attack */}
              {isAttacking && (
                <circle cx="50" cy="70" r="46" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="8 6" />
              )}
            </svg>
          </div>
        )}

        {/* 2. The Heavy Press - Densely rolled broadsheet newspaper with tension straps */}
        {weapon === "newspaper" && (
          <div className="relative w-24 h-44 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)]">
            <svg viewBox="0 0 100 160" className="w-full h-full">
              {/* Densely Rolled Newspaper Cylinder */}
              <path
                d="M 36 8 L 74 18 L 56 154 L 18 144 Z"
                fill="#f8fafc"
                stroke="#1e293b"
                strokeWidth="3"
              />
              {/* Internal paper spiral curl at the head */}
              <path d="M 36 8 C 50 4, 74 8, 74 18 C 74 26, 42 22, 42 16" stroke="#475569" strokeWidth="2" fill="none" />

              {/* Bold Newspaper Headline Text lines */}
              <text x="26" y="38" fill="#0f172a" fontSize="7" fontWeight="900" transform="rotate(15 26 38)">
                MASS EXTINCTION
              </text>
              <line x1="28" y1="50" x2="64" y2="60" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="26" y1="62" x2="62" y2="72" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="74" x2="60" y2="84" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="22" y1="86" x2="58" y2="96" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

              {/* Heavy tension black tape strap */}
              <rect x="22" y="98" width="46" height="12" rx="3" fill="#0f172a" stroke="#000000" strokeWidth="2" transform="rotate(15 35 104)" />

              {/* Clenched Hand gripping the handle */}
              <g id="newspaper-grip" transform="translate(25, 115)">
                <rect x="0" y="0" width="38" height="26" rx="8" fill="#d4a373" stroke="#78350f" strokeWidth="2" />
                <line x1="10" y1="0" x2="10" y2="26" stroke="#78350f" strokeWidth="1.5" />
                <line x1="20" y1="0" x2="20" y2="26" stroke="#78350f" strokeWidth="1.5" />
                <line x1="28" y1="0" x2="28" y2="26" stroke="#78350f" strokeWidth="1.5" />
              </g>

              {isAttacking && (
                <line x1="15" y1="10" x2="90" y2="30" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
              )}
            </svg>
          </div>
        )}

        {/* 3. Volt Swatter 9000 - High-voltage steel grid with lightning sparks */}
        {weapon === "swatter" && (
          <div className="relative w-28 h-48 filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.6)]">
            <svg viewBox="0 0 100 170" className="w-full h-full">
              {/* Heavy steel handle shaft */}
              <rect x="46" y="60" width="8" height="98" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              <line x1="48" y1="70" x2="48" y2="150" stroke="#06b6d4" strokeWidth="1.5" />

              {/* High-Voltage Grid Frame */}
              <rect
                x="16"
                y="6"
                width="68"
                height="56"
                rx="8"
                fill="#083344"
                fillOpacity="0.4"
                stroke="#0891b2"
                strokeWidth="4"
              />
              {/* Electrified steel mesh wires */}
              <line x1="26" y1="6" x2="26" y2="62" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="36" y1="6" x2="36" y2="62" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="46" y1="6" x2="46" y2="62" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="56" y1="6" x2="56" y2="62" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="66" y1="6" x2="66" y2="62" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="76" y1="6" x2="76" y2="62" stroke="#22d3ee" strokeWidth="1.5" />

              <line x1="16" y1="18" x2="84" y2="18" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="16" y1="30" x2="84" y2="30" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="16" y1="42" x2="84" y2="42" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="16" y1="54" x2="84" y2="54" stroke="#22d3ee" strokeWidth="1.5" />

              {/* High Voltage Arc Sparks */}
              <polygon points="50,14 44,28 51,28 47,42 60,26 53,26" fill="#fef08a" stroke="#eab308" strokeWidth="1.5" />

              {/* Clenched Hand gripping the handle */}
              <g id="swatter-grip" transform="translate(32, 118)">
                <rect x="0" y="0" width="36" height="24" rx="8" fill="#d4a373" stroke="#78350f" strokeWidth="2" />
                <line x1="9" y1="0" x2="9" y2="24" stroke="#78350f" strokeWidth="1.5" />
                <line x1="18" y1="0" x2="18" y2="24" stroke="#78350f" strokeWidth="1.5" />
                <line x1="27" y1="0" x2="27" y2="24" stroke="#78350f" strokeWidth="1.5" />
              </g>

              {isAttacking && (
                <circle cx="50" cy="34" r="32" fill="none" stroke="#22d3ee" strokeWidth="4" className="animate-ping" />
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
