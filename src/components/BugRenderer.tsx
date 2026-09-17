import React from "react";
import { Bug } from "../types";

interface BugRendererProps {
  bug: Bug;
}

export const BugRenderer: React.FC<BugRendererProps> = ({ bug }) => {
  const { species, hp, maxHp, angle, isFlying, scale } = bug;

  return (
    <div
      className="absolute pointer-events-none transition-transform will-change-transform"
      style={{
        left: `${bug.x}%`,
        top: `${bug.y}%`,
        transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${scale})`,
        zIndex: isFlying ? 25 : 15,
      }}
    >
      {/* 3D height shadow on tiles for flying bugs */}
      {isFlying && (
        <div
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-10 h-5 rounded-full bg-slate-950/30 blur-[3px] pointer-events-none"
          style={{ transform: `scale(${scale * 0.95})` }}
        />
      )}

      {/* 1. Cockroach - Menacing, dark chitinous carapace with spiny legs & twitching antennae */}
      {species === "roach" && (
        <div className="relative w-16 h-20 animate-bug-wiggle select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]">
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Long razor antennae */}
            <path
              d="M 45 20 Q 20 -20 2 -18"
              stroke="#451a03"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 55 20 Q 80 -20 98 -18"
              stroke="#451a03"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Thorny jointed legs with sharp tarsal claws */}
            {/* Front legs */}
            <path d="M 36 40 L 14 26 L 4 38" stroke="#451a03" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 64 40 L 86 26 L 96 38" stroke="#451a03" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {/* Mid legs with spines */}
            <path d="M 33 60 L 8 58 L 2 72" stroke="#451a03" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 67 60 L 92 58 L 98 72" stroke="#451a03" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {/* Leg spines */}
            <line x1="20" y1="58" x2="16" y2="52" stroke="#290e02" strokeWidth="2" />
            <line x1="80" y1="58" x2="84" y2="52" stroke="#290e02" strokeWidth="2" />
            {/* Rear legs (long & fast) */}
            <path d="M 36 84 L 10 108 L 2 130" stroke="#451a03" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 64 84 L 90 108 L 98 130" stroke="#451a03" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Cerci (sensory spines at abdomen rear) */}
            <line x1="42" y1="112" x2="35" y2="128" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="58" y1="112" x2="65" y2="128" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />

            {/* Abdomen / Elytra (Leathery glossy shell) */}
            <ellipse cx="50" cy="74" rx="24" ry="40" fill="#290e02" />
            <ellipse cx="50" cy="74" rx="21" ry="37" fill="#78350f" />
            {/* Carapace wing fold suture */}
            <line x1="50" y1="36" x2="50" y2="114" stroke="#1c0a00" strokeWidth="2.5" />
            {/* Chitinous body segment banding */}
            <path d="M 30 52 Q 50 60 70 52" stroke="#451a03" strokeWidth="2" fill="none" />
            <path d="M 28 68 Q 50 78 72 68" stroke="#451a03" strokeWidth="2.5" fill="none" />
            <path d="M 30 84 Q 50 96 70 84" stroke="#451a03" strokeWidth="2.5" fill="none" />
            <path d="M 34 98 Q 50 108 66 98" stroke="#451a03" strokeWidth="2" fill="none" />

            {/* Specular oily sheen gradient line */}
            <path d="M 40 44 Q 44 76 42 104" stroke="#f59e0b" strokeWidth="3" opacity="0.6" strokeLinecap="round" fill="none" />

            {/* Pronotum (Protective neck shield) */}
            <path d="M 32 32 C 32 18, 68 18, 68 32 C 68 44, 32 44, 32 32 Z" fill="#451a03" stroke="#1c0a00" strokeWidth="2" />
            <ellipse cx="50" cy="30" rx="12" ry="7" fill="#92400e" />

            {/* Menacing Black/Amber Eyes */}
            <ellipse cx="40" cy="24" rx="3.5" ry="4" fill="#0f172a" />
            <circle cx="39" cy="23" r="1.5" fill="#f59e0b" />
            <ellipse cx="60" cy="24" rx="3.5" ry="4" fill="#0f172a" />
            <circle cx="61" cy="23" r="1.5" fill="#f59e0b" />
          </svg>
        </div>
      )}

      {/* 2. Black House Fly / Blowfly - Iridescent wings, dark bristled body, compound red multifaceted eyes */}
      {species === "fly" && (
        <div className="relative w-16 h-16 animate-fly-buzz select-none filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">
          <svg viewBox="0 0 110 110" className="w-full h-full">
            {/* Rapid buzzing iridescent wings with realistic vein netting */}
            <g opacity="0.85">
              <ellipse
                cx="30"
                cy="40"
                rx="28"
                ry="13"
                fill="url(#wingGrad)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                transform="rotate(-28 30 40)"
              />
              <ellipse
                cx="80"
                cy="40"
                rx="28"
                ry="13"
                fill="url(#wingGrad)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                transform="rotate(28 80 40)"
              />
              {/* Wing vein architecture */}
              <line x1="30" y1="40" x2="8" y2="28" stroke="#0369a1" strokeWidth="1.5" />
              <line x1="30" y1="40" x2="16" y2="48" stroke="#0369a1" strokeWidth="1.2" />
              <line x1="80" y1="40" x2="102" y2="28" stroke="#0369a1" strokeWidth="1.5" />
              <line x1="80" y1="40" x2="94" y2="48" stroke="#0369a1" strokeWidth="1.2" />
            </g>

            <defs>
              <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.75" />
              </linearGradient>
            </defs>

            {/* Jointed hairy legs */}
            <path d="M 42 55 L 18 60 L 12 72" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 68 55 L 92 60 L 98 72" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 44 72 L 20 86 L 14 100" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 66 72 L 90 86 L 96 100" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Abdomen (Dark metallic graphite with segment lines) */}
            <ellipse cx="55" cy="74" rx="17" ry="22" fill="#090d16" />
            <ellipse cx="55" cy="74" rx="14" ry="19" fill="#1e293b" />
            <line x1="43" y1="68" x2="67" y2="68" stroke="#334155" strokeWidth="2.5" />
            <line x1="42" y1="78" x2="68" y2="78" stroke="#334155" strokeWidth="2.5" />
            <line x1="46" y1="88" x2="64" y2="88" stroke="#334155" strokeWidth="2.5" />

            {/* Thorax with longitudinal predator stripes */}
            <ellipse cx="55" cy="50" rx="14" ry="15" fill="#0f172a" />
            <line x1="51" y1="38" x2="51" y2="62" stroke="#475569" strokeWidth="2.5" />
            <line x1="59" y1="38" x2="59" y2="62" stroke="#475569" strokeWidth="2.5" />

            {/* Massive Deep Crimson Compound Eyes */}
            <ellipse cx="44" cy="34" rx="9" ry="11" fill="#991b1b" stroke="#450a0a" strokeWidth="1.5" />
            <ellipse cx="42" cy="31" rx="4" ry="6" fill="#ef4444" opacity="0.8" />
            <circle cx="41" cy="28" r="1.5" fill="#ffffff" />

            <ellipse cx="66" cy="34" rx="9" ry="11" fill="#991b1b" stroke="#450a0a" strokeWidth="1.5" />
            <ellipse cx="68" cy="31" rx="4" ry="6" fill="#ef4444" opacity="0.8" />
            <circle cx="69" cy="28" r="1.5" fill="#ffffff" />

            {/* Proboscis / mouthparts */}
            <path d="M 53 28 L 55 18 L 57 28" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      )}

      {/* 3. Armored Rhino Beetle - Heavy chitin plate armor, menacing horns, takes 2 hits */}
      {species === "beetle" && (
        <div className="relative w-18 h-22 select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
          {hp < maxHp && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-700 text-white font-black text-[10px] tracking-wider px-2 py-0.5 rounded border border-red-400 shadow-md whitespace-nowrap uppercase animate-pulse">
              ARMOR CRACKED!
            </div>
          )}
          <svg viewBox="0 0 100 130" className="w-full h-full">
            {/* Heavy jagged pincer horns */}
            <path d="M 44 24 L 38 6 Q 50 1 50 10" stroke="#022c22" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 56 24 L 62 6 Q 50 1 50 10" stroke="#022c22" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 50 18 L 50 2" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" />

            {/* Thick heavy spiny claws */}
            <path d="M 28 48 L 5 36 L 2 52" stroke="#022c22" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 72 48 L 95 36 L 98 52" stroke="#022c22" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 26 70 L 4 76 L 2 92" stroke="#022c22" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 74 70 L 96 76 L 98 92" stroke="#022c22" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 32 94 L 10 116" stroke="#022c22" strokeWidth="6" strokeLinecap="round" />
            <path d="M 68 94 L 90 116" stroke="#022c22" strokeWidth="6" strokeLinecap="round" />

            {/* Heavy Chitin Carapace Shell */}
            <ellipse cx="50" cy="74" rx="29" ry="38" fill="#022c22" />
            <ellipse cx="50" cy="74" rx="25" ry="34" fill="#065f46" />
            {/* Metallic emerald highlight sheen */}
            <ellipse cx="44" cy="70" rx="14" ry="24" fill="#10b981" opacity="0.3" />
            {/* Shell central divide */}
            <line x1="50" y1="38" x2="50" y2="108" stroke="#022c22" strokeWidth="4" />

            {/* Armor Fracture Cracks if damaged */}
            {hp < maxHp && (
              <g stroke="#facc15" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="drop-shadow(0 0 4px #eab308)">
                <path d="M 50 55 L 66 65 L 58 82 L 74 95" />
                <path d="M 50 72 L 36 84 L 42 98" />
              </g>
            )}

            {/* Armored Head Plate */}
            <path d="M 33 26 C 33 14, 67 14, 67 26 C 67 38, 33 38, 33 26 Z" fill="#022c22" stroke="#064e3b" strokeWidth="2" />

            {/* Glowing predatory eyes */}
            <ellipse cx="40" cy="26" rx="3.5" ry="2.5" fill="#ef4444" />
            <circle cx="40" cy="26" r="1.5" fill="#fef08a" />
            <ellipse cx="60" cy="26" rx="3.5" ry="2.5" fill="#ef4444" />
            <circle cx="60" cy="26" r="1.5" fill="#fef08a" />
          </svg>
        </div>
      )}

      {/* 4. Venomous Hunter Spider - Jointed arched legs, fangs, aggressive posture */}
      {species === "spider" && (
        <div className="relative w-18 h-18 animate-spider-legs select-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)]">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            {/* 8 Articulated Arched Spidery Legs with sharp tip claws */}
            {/* Pair 1 */}
            <path d="M 48 48 Q 24 12 6 22 L 2 30" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 72 48 Q 96 12 114 22 L 118 30" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Pair 2 */}
            <path d="M 44 54 Q 14 36 4 52" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 76 54 Q 106 36 116 52" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Pair 3 */}
            <path d="M 44 66 Q 14 84 4 76" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 76 66 Q 106 84 116 76" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Pair 4 */}
            <path d="M 48 76 Q 24 110 8 102 L 2 110" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 72 76 Q 96 110 112 102 L 118 110" stroke="#18181b" strokeWidth="4.5" strokeLinecap="round" fill="none" />

            {/* Heavy Bulbous Abdomen with Crimson Skull / Venom Hazard Marking */}
            <ellipse cx="60" cy="78" rx="20" ry="24" fill="#09090b" />
            <ellipse cx="60" cy="78" rx="17" ry="20" fill="#27272a" />
            {/* Menacing red hourglass hazard emblem */}
            <polygon points="54,68 66,68 60,78" fill="#dc2626" />
            <polygon points="54,88 66,88 60,78" fill="#dc2626" />

            {/* Cephalothorax (Head) */}
            <circle cx="60" cy="50" r="14" fill="#18181b" />

            {/* Chelicerae & Fangs */}
            <path d="M 55 36 L 53 26 L 57 32" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 65 36 L 67 26 L 63 32" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Cluster of 6 predatory glowing venom eyes */}
            <circle cx="54" cy="44" r="2.5" fill="#ef4444" />
            <circle cx="66" cy="44" r="2.5" fill="#ef4444" />
            <circle cx="58" cy="42" r="2" fill="#ffffff" />
            <circle cx="62" cy="42" r="2" fill="#ffffff" />
            <circle cx="53" cy="49" r="1.8" fill="#ef4444" />
            <circle cx="67" cy="49" r="1.8" fill="#ef4444" />
          </svg>
        </div>
      )}

      {/* 5. Fire Ant - Aggressive, vicious mandibles, reddish-black segmented body */}
      {species === "ant" && (
        <div className="relative w-14 h-16 animate-bug-wiggle select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
          <svg viewBox="0 0 100 130" className="w-full h-full">
            {/* Sharp curved biting mandibles */}
            <path d="M 44 26 Q 38 10 48 10" stroke="#7f1d1d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 56 26 Q 62 10 52 10" stroke="#7f1d1d" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Antennae */}
            <path d="M 46 28 L 30 14 L 18 18" stroke="#18181b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 54 28 L 70 14 L 82 18" stroke="#18181b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* 6 Rapid scurrying jointed legs */}
            <path d="M 40 48 L 14 34" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 60 48 L 86 34" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 38 64 L 10 64" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 62 64 L 90 64" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 40 80 L 12 104" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 60 80 L 88 104" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" />

            {/* Large pointed sting Gaster (Abdomen) */}
            <ellipse cx="50" cy="94" rx="20" ry="26" fill="#18181b" />
            <ellipse cx="48" cy="90" rx="16" ry="20" fill="#7f1d1d" />
            <line x1="50" y1="116" x2="50" y2="124" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />

            {/* Thin Petiole waist */}
            <ellipse cx="50" cy="74" rx="6" ry="7" fill="#18181b" />

            {/* Thorax */}
            <ellipse cx="50" cy="58" rx="13" ry="14" fill="#991b1b" />

            {/* Head */}
            <ellipse cx="50" cy="34" rx="15" ry="13" fill="#18181b" />

            {/* Compound aggressive dark eyes */}
            <ellipse cx="42" cy="32" rx="3.5" ry="4" fill="#450a0a" />
            <circle cx="41" cy="30" r="1.5" fill="#f87171" />
            <ellipse cx="58" cy="32" rx="3.5" ry="4" fill="#450a0a" />
            <circle cx="59" cy="30" r="1.5" fill="#f87171" />
          </svg>
        </div>
      )}

      {/* 6. Radioactive Alpha Roaster / Golden Mutant - High-speed, electric energy aura */}
      {species === "golden" && (
        <div className="relative w-18 h-20 animate-bug-wiggle select-none filter drop-shadow-[0_0_16px_rgba(234,179,8,0.75)]">
          {/* Intense electric energy pulse */}
          <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-lg animate-pulse" />
          <svg viewBox="0 0 100 130" className="w-full h-full relative z-10">
            {/* Lightning antennae */}
            <path d="M 45 22 L 30 6 L 15 12" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 55 22 L 70 6 L 85 12" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Gold chitinous legs */}
            <path d="M 35 44 L 8 28" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 65 44 L 92 28" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 33 66 L 4 66" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 67 66 L 96 66" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 35 88 L 10 114" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
            <path d="M 65 88 L 90 114" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />

            {/* Radiant Golden Carapace */}
            <ellipse cx="50" cy="74" rx="24" ry="36" fill="#b45309" />
            <ellipse cx="50" cy="74" rx="20" ry="32" fill="#fbbf24" />
            <path d="M 40 48 Q 44 74 42 102" stroke="#ffffff" strokeWidth="4" opacity="0.8" strokeLinecap="round" fill="none" />

            {/* Bio-hazard electric rune */}
            <polygon points="50,60 44,72 50,72 46,84 56,70 50,70" fill="#dc2626" />

            {/* Head */}
            <circle cx="50" cy="32" r="14" fill="#92400e" />
            <circle cx="50" cy="32" r="11" fill="#f59e0b" />

            {/* Blazing Red Eyes */}
            <circle cx="43" cy="30" r="3.5" fill="#dc2626" />
            <circle cx="43" cy="30" r="1.5" fill="#ffffff" />
            <circle cx="57" cy="30" r="3.5" fill="#dc2626" />
            <circle cx="57" cy="30" r="1.5" fill="#ffffff" />
          </svg>
        </div>
      )}
    </div>
  );
};
