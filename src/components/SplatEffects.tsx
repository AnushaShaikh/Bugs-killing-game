import React from "react";
import { Particle, SplatDecal } from "../types";

interface SplatEffectsProps {
  decals: SplatDecal[];
  particles: Particle[];
}

export const SplatEffects: React.FC<SplatEffectsProps> = ({ decals, particles }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* 1. Visceral Splat Decals on the Tile Floor (Non-baby, stylized action impact marks) */}
      {decals.map((decal) => (
        <div
          key={decal.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-squish-decal select-none"
          style={{
            left: `${decal.x}px`,
            top: `${decal.y}px`,
            width: `${decal.size}px`,
            height: `${decal.size}px`,
            transform: `translate(-50%, -50%) rotate(${decal.rotation}deg)`,
          }}
        >
          {decal.weapon === "shoe" && (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
              {/* Heavy combat sole tread impression with dark ichor splatter */}
              <ellipse cx="50" cy="50" rx="38" ry="26" fill={decal.color} opacity="0.85" />
              {/* Radiating impact droplets */}
              <circle cx="16" cy="24" r="4.5" fill={decal.color} opacity="0.9" />
              <circle cx="86" cy="30" r="6" fill={decal.color} opacity="0.9" />
              <circle cx="78" cy="80" r="5" fill={decal.color} opacity="0.9" />
              <circle cx="22" cy="76" r="4.5" fill={decal.color} opacity="0.9" />
              <circle cx="50" cy="14" r="3.5" fill={decal.color} opacity="0.9" />
              <circle cx="50" cy="90" r="4.5" fill={decal.color} opacity="0.9" />
              {/* Combat lug sole tread marks */}
              <rect x="28" y="38" width="44" height="6" rx="2" fill="#000000" opacity="0.35" />
              <rect x="24" y="48" width="52" height="6" rx="2" fill="#000000" opacity="0.35" />
              <rect x="28" y="58" width="44" height="6" rx="2" fill="#000000" opacity="0.35" />
            </svg>
          )}

          {decal.weapon === "newspaper" && (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
              {/* High-speed whip crack impact splatter */}
              <path
                d="M 50 10 Q 56 36 78 22 Q 66 46 92 50 Q 68 62 82 84 Q 54 66 50 92 Q 42 66 18 84 Q 32 62 8 50 Q 34 46 22 22 Q 44 36 50 10 Z"
                fill={decal.color}
                opacity="0.85"
              />
              <circle cx="12" cy="18" r="4" fill={decal.color} />
              <circle cx="88" cy="88" r="4.5" fill={decal.color} />
              <line x1="20" y1="50" x2="80" y2="50" stroke="#0f172a" strokeWidth="2" opacity="0.4" strokeDasharray="4 2" />
            </svg>
          )}

          {decal.weapon === "swatter" && (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
              {/* High-voltage electrified scorch mark with cyan sparks */}
              <rect x="20" y="20" width="60" height="60" rx="8" fill={decal.color} opacity="0.75" />
              {/* Steel mesh grid lines */}
              <line x1="35" y1="20" x2="35" y2="80" stroke="#000000" strokeWidth="2.5" opacity="0.5" />
              <line x1="50" y1="20" x2="50" y2="80" stroke="#000000" strokeWidth="2.5" opacity="0.5" />
              <line x1="65" y1="20" x2="65" y2="80" stroke="#000000" strokeWidth="2.5" opacity="0.5" />
              <line x1="20" y1="35" x2="80" y2="35" stroke="#000000" strokeWidth="2.5" opacity="0.5" />
              <line x1="20" y1="50" x2="80" y2="50" stroke="#000000" strokeWidth="2.5" opacity="0.5" />
              <line x1="20" y1="65" x2="80" y2="65" stroke="#000000" strokeWidth="2.5" opacity="0.5" />
            </svg>
          )}
        </div>
      ))}

      {/* 2. Kinetic Impact Burst Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.life / p.maxLife,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 8px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};
