import React, { useRef, useEffect, useCallback } from "react";
import { BugSpecies, DifficultyLevel, WeaponType, SyncedBugData, OpponentAction } from "../types";
import { WEAPONS } from "../data/weapons";
import {
  playBugSquish,
  playMissWhoosh,
  playWeaponSound,
  playPenaltyAlarm,
  triggerHaptic,
} from "../utils/audio";

interface GameArenaCanvasProps {
  weapon: WeaponType;
  isPlaying: boolean;
  isSpectating?: boolean;
  speedMultiplier: number;
  difficulty?: DifficultyLevel;
  kills: number;
  incomingRoomBug?: SyncedBugData | null;
  incomingOpponentSmash?: OpponentAction | null;
  spectatingTargetId?: string | null;
  isRoomMode?: boolean;
  onHit: (info: {
    points: number;
    isCrit: boolean;
    text: string;
    subtext?: string;
    hitCount: number;
    killedAny: boolean;
    strikeX: number;
    strikeY: number;
    normX?: number;
    normY?: number;
    bugId?: string;
  }) => void;
  onMiss: () => void;
  onBugEscaped?: () => void;
  onButterflyHarm?: () => void;
}

interface CanvasBug {
  id: string;
  species: BugSpecies;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number;
  hp: number;
  maxHp: number;
  points: number;
  bornAt: number;
  isFlying: boolean;
  scale: number;
  wigglePhase: number;
  radius: number;
  hasEntered: boolean;
}

interface CanvasDecal {
  id: string;
  x: number;
  y: number;
  color: string;
  dryColor: string;
  size: number;
  rotation: number;
  weapon: WeaponType;
  bornAt: number;
  lifespan: number; // in milliseconds
  splatPoints: { dx: number; dy: number; r: number }[];
}

interface CanvasParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface ArmAnimation {
  active: boolean;
  progress: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  windupX: number;
  windupY: number;
  phase: "windup" | "slam" | "impact" | "recover" | "idle";
  timer: number;
  aimX: number;
  aimY: number;
  squashX: number;
  squashY: number;
  trail: { x: number; y: number; angle: number; alpha: number }[];
}

interface RivalStrike {
  id: string;
  x: number;
  y: number;
  weapon: WeaponType;
  playerName: string;
  bornAt: number;
  color: string;
}

export const GameArenaCanvas: React.FC<GameArenaCanvasProps> = ({
  weapon,
  isPlaying,
  isSpectating = false,
  speedMultiplier,
  difficulty = "easy",
  kills,
  incomingRoomBug,
  incomingOpponentSmash,
  spectatingTargetId,
  isRoomMode = false,
  onHit,
  onMiss,
  onBugEscaped,
  onButterflyHarm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable Game State stored in Refs - Zero React Re-render Lag
  const bugsRef = useRef<CanvasBug[]>([]);
  const decalsRef = useRef<CanvasDecal[]>([]);
  const particlesRef = useRef<CanvasParticle[]>([]);
  const rivalStrikesRef = useRef<RivalStrike[]>([]);
  const isRoomModeRef = useRef(isRoomMode);
  useEffect(() => {
    isRoomModeRef.current = isRoomMode;
  }, [isRoomMode]);

  const armRef = useRef<ArmAnimation>({
    active: false,
    progress: 0,
    targetX: 0,
    targetY: 0,
    startX: 0,
    startY: 0,
    windupX: 0,
    windupY: 0,
    phase: "idle",
    timer: 0,
    aimX: 400,
    aimY: 300,
    squashX: 1,
    squashY: 1,
    trail: [],
  });
  const screenShakeRef = useRef(0);
  const lastAttackTimeRef = useRef(0);
  const dimensionsRef = useRef({ width: 800, height: 600 });
  const animFrameIdRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef(0);

  // Keep difficulty in a ref
  const difficultyRef = useRef<DifficultyLevel>(difficulty);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Keep speedMultiplier in a ref so the loop updates seamlessly
  const speedRef = useRef(speedMultiplier);
  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const killsRef = useRef(kills);
  useEffect(() => {
    killsRef.current = kills;
  }, [kills]);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (!isPlaying) {
      // Clear active bugs and reset arm when game halts
      armRef.current.active = false;
      armRef.current.phase = "idle";
    }
  }, [isPlaying]);

  // Handle Canvas Resize with devicePixelRatio for Retina clarity
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      dimensionsRef.current = { width: rect.width, height: rect.height };
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Handle Server-Authoritative Synchronized Room Bugs
  useEffect(() => {
    if (!isRoomMode || !incomingRoomBug) return;
    const { width, height } = dimensionsRef.current;
    if (width <= 0 || height <= 0) return;

    if (bugsRef.current.some((b) => b.id === incomingRoomBug.id)) return;

    const startX = incomingRoomBug.normX * width;
    const startY = incomingRoomBug.normY * height;
    const targetX = incomingRoomBug.targetNormX * width;
    const targetY = incomingRoomBug.targetNormY * height;
    const angle = Math.atan2(targetY - startY, targetX - startX);

    const newBug: CanvasBug = {
      id: incomingRoomBug.id,
      species: incomingRoomBug.species,
      x: startX,
      y: startY,
      targetX,
      targetY,
      speed: incomingRoomBug.speed,
      angle,
      hp: incomingRoomBug.hp,
      maxHp: incomingRoomBug.maxHp,
      points: incomingRoomBug.points,
      bornAt: incomingRoomBug.bornAt,
      isFlying:
        incomingRoomBug.isFlying ??
        (incomingRoomBug.species === "fly" || incomingRoomBug.species === "butterfly"),
      scale:
        incomingRoomBug.species === "butterfly"
          ? 1.15
          : incomingRoomBug.species === "golden"
          ? 1.15
          : incomingRoomBug.species === "beetle"
          ? 1.1
          : 1,
      wigglePhase: Math.random() * 10,
      radius: incomingRoomBug.radius,
      hasEntered: false,
    };

    if (bugsRef.current.length < 32) {
      bugsRef.current.push(newBug);
    }
  }, [incomingRoomBug, isRoomMode]);

  // Handle Synchronized Opponent Smash Action & Live Spectate Movement
  useEffect(() => {
    if (!incomingOpponentSmash) return;
    const { width, height } = dimensionsRef.current;
    if (width <= 0 || height <= 0) return;

    const smashX = (incomingOpponentSmash.normX ?? 0.5) * width;
    const smashY = (incomingOpponentSmash.normY ?? 0.5) * height;
    const targetWeapon = incomingOpponentSmash.weapon || "shoe";

    const isSpectatingTarget =
      isSpectating && spectatingTargetId === incomingOpponentSmash.playerId;

    if (isSpectatingTarget) {
      // Live Spectator Animation: First-person weapon slams right where spectated player struck!
      const currX = armRef.current.startX || width * 0.74 - 50;
      const currY = armRef.current.startY || height - 90;
      const dx = smashX - currX;
      const dy = smashY - currY;
      const dist = Math.hypot(dx, dy) || 1;
      const windupDist = 42;
      const windupX = currX - (dx / dist) * windupDist;
      const windupY = Math.max(100, currY - (dy / dist) * windupDist - 28);

      armRef.current = {
        active: true,
        progress: 0,
        targetX: smashX,
        targetY: smashY,
        startX: currX,
        startY: currY,
        windupX,
        windupY,
        phase: "windup",
        timer: 0,
        aimX: smashX,
        aimY: smashY,
        squashX: 1,
        squashY: 1,
        trail: [],
      };

      playWeaponSound(targetWeapon);
      if (targetWeapon === "shoe") {
        screenShakeRef.current = 10;
      }
    } else {
      // Live Multiplayer Rival Strike Ring: Visual ripple with player tag
      rivalStrikesRef.current.push({
        id: Math.random().toString(),
        x: smashX,
        y: smashY,
        weapon: targetWeapon,
        playerName: incomingOpponentSmash.playerName,
        bornAt: Date.now(),
        color: WEAPONS[targetWeapon]?.color || "#f59e0b",
      });
    }

    // Bug damage & squash synchronization
    if (incomingOpponentSmash.hit) {
      const bugs = bugsRef.current;
      let targetBugIndex = -1;

      if (incomingOpponentSmash.bugId) {
        targetBugIndex = bugs.findIndex((b) => b.id === incomingOpponentSmash.bugId);
      }
      if (targetBugIndex === -1 && incomingOpponentSmash.killed) {
        let closestDist = 95;
        bugs.forEach((b, idx) => {
          const d = Math.hypot(b.x - smashX, b.y - smashY);
          if (d < closestDist) {
            closestDist = d;
            targetBugIndex = idx;
          }
        });
      }

      if (targetBugIndex >= 0) {
        const bug = bugs[targetBugIndex];
        if (incomingOpponentSmash.killed) {
          playBugSquish();
          triggerHaptic(30);

          const splatColors: Record<BugSpecies, { wet: string; dry: string }> = {
            ant: { wet: "#18181b", dry: "#52525b" },
            roach: { wet: "#78350f", dry: "#a16207" },
            fly: { wet: "#0284c7", dry: "#64748b" },
            beetle: { wet: "#065f46", dry: "#334155" },
            spider: { wet: "#3b0764", dry: "#6b7280" },
            golden: { wet: "#d97706", dry: "#b45309" },
            butterfly: { wet: "#0284c7", dry: "#38bdf8" },
          };
          const speciesColors = splatColors[bug.species] || { wet: "#15803d", dry: "#475569" };

          const splatPoints: { dx: number; dy: number; r: number }[] = [];
          for (let d = 0; d < 7; d++) {
            const angle = Math.random() * Math.PI * 2;
            const distRadius = (12 + Math.random() * 26) * bug.scale;
            splatPoints.push({
              dx: Math.cos(angle) * distRadius,
              dy: Math.sin(angle) * distRadius,
              r: (3 + Math.random() * 5) * bug.scale,
            });
          }

          decalsRef.current.push({
            id: Math.random().toString(),
            x: bug.x,
            y: bug.y,
            color: speciesColors.wet,
            dryColor: speciesColors.dry,
            size: 58 * bug.scale,
            rotation: Math.random() * Math.PI * 2,
            weapon: targetWeapon,
            bornAt: Date.now(),
            lifespan: 4500,
            splatPoints,
          });

          for (let pIdx = 0; pIdx < 12; pIdx++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 3 + Math.random() * 6;
            particlesRef.current.push({
              id: Math.random().toString(),
              x: bug.x,
              y: bug.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 2,
              color: speciesColors.wet,
              size: 2.5 + Math.random() * 4,
              life: 25,
              maxLife: 25,
            });
          }

          bugs.splice(targetBugIndex, 1);
        }
      }
    }
  }, [incomingOpponentSmash, isSpectating, spectatingTargetId]);

  // Bug Spawner logic
  const spawnBug = useCallback(() => {
    const { width, height } = dimensionsRef.current;
    if (width <= 0 || height <= 0) return;

    const diff = difficultyRef.current;
    const butterflyCount = bugsRef.current.filter((b) => b.species === "butterfly").length;
    const maxButterflies = diff === "expert" ? 2 : 1;
    const canSpawnButterfly = (diff === "hard" || diff === "expert") && butterflyCount < maxButterflies;
    const shouldSpawnButterfly = canSpawnButterfly && (Math.random() < 0.32 || butterflyCount === 0);

    const speciesList: BugSpecies[] = ["roach", "roach", "fly", "fly", "spider", "ant"];
    if (Math.random() < 0.35) speciesList.push("beetle");
    if (Math.random() < 0.15) speciesList.push("golden");

    const species: BugSpecies = shouldSpawnButterfly
      ? "butterfly"
      : speciesList[Math.floor(Math.random() * speciesList.length)];

    const id = Math.random().toString(36).substring(2, 9);

    // Spawn from outside border
    const edge = Math.floor(Math.random() * 4);
    let startX = 0;
    let startY = 0;
    let targetX = 0;
    let targetY = 0;

    if (edge === 0) {
      // Top
      startX = Math.random() * width;
      startY = -40;
      targetX = Math.random() * width;
      targetY = height * 0.7 + Math.random() * (height * 0.25);
    } else if (edge === 1) {
      // Right
      startX = width + 40;
      startY = Math.random() * height;
      targetX = width * 0.15 + Math.random() * (width * 0.5);
      targetY = Math.random() * height;
    } else if (edge === 2) {
      // Bottom
      startX = Math.random() * width;
      startY = height + 40;
      targetX = Math.random() * width;
      targetY = height * 0.15 + Math.random() * (height * 0.5);
    } else {
      // Left
      startX = -40;
      startY = Math.random() * height;
      targetX = width * 0.35 + Math.random() * (width * 0.5);
      targetY = Math.random() * height;
    }

    const angle = Math.atan2(targetY - startY, targetX - startX) + Math.PI / 2;

    let hp = 1;
    let maxHp = 1;
    let speed = 90 + Math.random() * 40;
    let points = 100;
    let isFlying = false;
    let radius = 26;

    if (species === "butterfly") {
      speed = 105 + Math.random() * 35;
      isFlying = true;
      points = 0;
      radius = 30;
    } else if (species === "roach") {
      speed = 150 + Math.random() * 60; // fast darting scurry
      points = 180;
      radius = 28;
    } else if (species === "fly") {
      speed = 130 + Math.random() * 50;
      isFlying = true;
      points = 220;
      radius = 24;
    } else if (species === "beetle") {
      hp = 2;
      maxHp = 2;
      speed = 60 + Math.random() * 30;
      points = 350;
      radius = 34;
    } else if (species === "spider") {
      speed = 100 + Math.random() * 45;
      points = 260;
      radius = 30;
    } else if (species === "golden") {
      speed = 195 + Math.random() * 70;
      points = 850;
      radius = 32;
    }

    const newBug: CanvasBug = {
      id,
      species,
      x: startX,
      y: startY,
      targetX,
      targetY,
      speed,
      angle,
      hp,
      maxHp,
      points,
      bornAt: Date.now(),
      isFlying,
      scale: species === "butterfly" ? 1.15 : species === "golden" ? 1.15 : species === "beetle" ? 1.1 : 1,
      wigglePhase: Math.random() * 10,
      radius,
      hasEntered: false,
    };

    const maxCapacity = diff === "expert" ? 24 : 12;
    if (bugsRef.current.length < maxCapacity) {
      bugsRef.current.push(newBug);
    }
  }, []);

  // Main 60-120 FPS High-Performance Canvas Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { width, height } = dimensionsRef.current;
      const currentSpeed = speedRef.current;
      const currentKills = killsRef.current;
      const active = isPlayingRef.current;

      // 1. Bug Spawner check (in expert mode, bugs are doubled!)
      // In synchronized room multiplayer, spawning is driven by the room bug broadcaster
      const isExpert = difficultyRef.current === "expert";
      const baseInterval = isExpert ? 420 : 900;
      const minInterval = isExpert ? 200 : 400;
      const spawnInterval = Math.max(baseInterval - Math.min(currentKills * 8, baseInterval * 0.5), minInterval);
      if (active && !isRoomModeRef.current && now - lastSpawnTimeRef.current > spawnInterval) {
        lastSpawnTimeRef.current = now;
        spawnBug();
      }

      // 2. Clear & Ceramic Floor
      ctx.save();

      // Camera Shake on heavy hits
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
        screenShakeRef.current *= 0.82;
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
      }

      ctx.clearRect(0, 0, width, height);

      // Ceramic Tile Floor Pattern
      drawTileFloor(ctx, width, height);

      // 3. Render Splat Decals & Timely Blemish Fading System
      // Decals dry up, blemish, and completely vanish within ~4.5 seconds!
      const currentTime = Date.now();
      for (let i = decalsRef.current.length - 1; i >= 0; i--) {
        const decal = decalsRef.current[i];
        const elapsed = currentTime - decal.bornAt;

        if (elapsed >= decal.lifespan) {
          // Stains are completely cleaned and removed timely!
          decalsRef.current.splice(i, 1);
        } else {
          // Calculate fading & drying progress
          const progress = elapsed / decal.lifespan; // 0.0 to 1.0
          drawDecal(ctx, decal, progress);
        }
      }

      // 4. Update & Render Realistic Bugs with slowly increasing speed
      const bugs = bugsRef.current;
      for (let i = bugs.length - 1; i >= 0; i--) {
        const bug = bugs[i];

        // Mark as entered once fully on floor
        if (!bug.hasEntered && bug.x >= 0 && bug.x <= width && bug.y >= 0 && bug.y <= height) {
          bug.hasEntered = true;
        }

        if (active) {
          // Move bug towards target with speedMultiplier
          const dx = bug.targetX - bug.x;
          const dy = bug.targetY - bug.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 20) {
            // Pick new realistic wandering point on the kitchen floor
            bug.targetX = width * 0.08 + Math.random() * (width * 0.84);
            bug.targetY = height * 0.12 + Math.random() * (height * 0.78);
            bug.angle = Math.atan2(bug.targetY - bug.y, bug.targetX - bug.x) + Math.PI / 2;
          } else {
            const moveStep = bug.speed * currentSpeed * dt;
            bug.x += (dx / dist) * moveStep;
            bug.y += (dy / dist) * moveStep;
            // Leg wiggle rate speeds up proportionally (butterflies flutter rhythmically)
            if (bug.species === "butterfly") {
              bug.wigglePhase += dt * 6.5;
            } else {
              bug.wigglePhase += dt * (18 * Math.sqrt(currentSpeed));
            }
          }
        }

        // Draw realistic bug with chitin anatomy, shadows & jointed limbs
        drawRealisticBug(ctx, bug);

        // Check if bug escaped outside after entering arena
        if (
          bug.hasEntered &&
          (bug.x < -60 || bug.x > width + 60 || bug.y < -60 || bug.y > height + 60)
        ) {
          const isButterfly = bug.species === "butterfly";
          bugs.splice(i, 1);
          // In expert mode: none of the bugs should escape kill all, and safe the butterflies!
          if (!isButterfly && isExpert && onBugEscaped && active) {
            onBugEscaped();
          }
        } else if (bug.x < -100 || bug.x > width + 100 || bug.y < -100 || bug.y > height + 100) {
          bugs.splice(i, 1);
        }
      }

      // 5. Update & Render Kinetic Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 22 * dt;
        p.life -= dt * 38;

        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // 5.5 Draw Rival / Opponent Strikes
      const nowMs = Date.now();
      const rivalStrikes = rivalStrikesRef.current;
      for (let i = rivalStrikes.length - 1; i >= 0; i--) {
        const rs = rivalStrikes[i];
        const age = nowMs - rs.bornAt;
        if (age > 650) {
          rivalStrikes.splice(i, 1);
          continue;
        }
        const progress = age / 650;
        const radius = 18 + progress * 42;
        const alpha = 1 - progress;

        ctx.save();
        ctx.strokeStyle = rs.color;
        ctx.lineWidth = 3 * (1 - progress);
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(rs.x, rs.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "bold 11px sans-serif";
        ctx.fillStyle = rs.color;
        ctx.textAlign = "center";
        ctx.fillText(rs.playerName, rs.x, rs.y - radius - 5);
        ctx.restore();
      }

      // 6. Update & Render First-Person Arm Strike
      updateAndDrawArm(ctx, armRef.current, weapon, width, height, dt);

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, [spawnBug, weapon, onBugEscaped]);

  // SMASH ATTACK LOGIC (Instantaneous, sub-millisecond precision)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isSpectating) return;

    const now = performance.now();
    const weaponConfig = WEAPONS[weapon];

    // High-speed Cooldown Check
    if (now - lastAttackTimeRef.current < weaponConfig.cooldown) {
      return;
    }
    lastAttackTimeRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const strikeX = e.clientX - rect.left;
    const strikeY = e.clientY - rect.top;

    // Trigger Arm Windup & Slam Attack
    const currX = armRef.current.startX || (canvas.width * 0.74 - 50);
    const currY = armRef.current.startY || (canvas.height - 90);
    const dx = strikeX - currX;
    const dy = strikeY - currY;
    const dist = Math.hypot(dx, dy) || 1;

    // Windup pulls back away from target with upward elevation
    const windupDist = 42;
    const windupX = currX - (dx / dist) * windupDist;
    const windupY = Math.max(100, currY - (dy / dist) * windupDist - 28);

    armRef.current = {
      active: true,
      progress: 0,
      targetX: strikeX,
      targetY: strikeY,
      startX: currX,
      startY: currY,
      windupX,
      windupY,
      phase: "windup",
      timer: 0,
      aimX: strikeX,
      aimY: strikeY,
      squashX: 1,
      squashY: 1,
      trail: [],
    };

    // Play attack sound & haptic
    playWeaponSound(weapon);
    if (weapon === "shoe") {
      screenShakeRef.current = 10;
    }

    // Hit Detection against active bugs
    const strikeRadius = weaponConfig.radius;
    let hitCount = 0;
    let totalPointsAwarded = 0;
    let killedAny = false;
    let isDirect = false;
    let butterflyStruck = false;
    let hitBugId: string | undefined;

    const bugs = bugsRef.current;
    for (let i = bugs.length - 1; i >= 0; i--) {
      const bug = bugs[i];
      const dist = Math.hypot(strikeX - bug.x, strikeY - bug.y);

      if (dist <= strikeRadius + bug.radius) {
        hitBugId = bug.id;
        // Struck a butterfly! "not allowed to kill if any player kills the butterfly one life will be lost"
        if (bug.species === "butterfly") {
          butterflyStruck = true;
          // Spawn glowing sparkle particles
          for (let pIdx = 0; pIdx < 18; pIdx++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 6;
            particlesRef.current.push({
              id: Math.random().toString(),
              x: bug.x,
              y: bug.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 2,
              color: Math.random() > 0.5 ? "#38bdf8" : "#fbbf24",
              size: 3 + Math.random() * 3,
              life: 30,
              maxLife: 30,
            });
          }
          bugs.splice(i, 1);
          continue;
        }

        hitCount++;
        bug.hp -= 1;

        isDirect = dist < strikeRadius * 0.35;
        const accuracyMultiplier = isDirect ? 2.2 : dist < strikeRadius * 0.65 ? 1.5 : 1.0;
        const ageSec = (Date.now() - bug.bornAt) / 1000;
        const speedFactorMultiplier = ageSec < 1.0 ? 2.2 : ageSec < 2.0 ? 1.5 : 1.0;
        const weaponMultiplier = weaponConfig.accuracyBonus;

        if (bug.hp <= 0) {
          killedAny = true;
          playBugSquish();
          triggerHaptic(45);

          const basePoints = bug.points;
          const points = Math.round(
            basePoints * accuracyMultiplier * speedFactorMultiplier * weaponMultiplier
          );
          totalPointsAwarded += points;

          // Splat and Dry Blemish Color based on bug species
          const splatColors: Record<BugSpecies, { wet: string; dry: string }> = {
            ant: { wet: "#18181b", dry: "#52525b" },
            roach: { wet: "#78350f", dry: "#a16207" },
            fly: { wet: "#0284c7", dry: "#64748b" },
            beetle: { wet: "#065f46", dry: "#334155" },
            spider: { wet: "#3b0764", dry: "#6b7280" },
            golden: { wet: "#d97706", dry: "#b45309" },
            butterfly: { wet: "#0284c7", dry: "#38bdf8" },
          };

          const speciesColors = splatColors[bug.species] || { wet: "#15803d", dry: "#475569" };

          // Generate randomized splat droplet pattern
          const splatPoints: { dx: number; dy: number; r: number }[] = [];
          const dropletCount = isDirect ? 8 : 5;
          for (let d = 0; d < dropletCount; d++) {
            const angle = Math.random() * Math.PI * 2;
            const distRadius = (12 + Math.random() * 26) * bug.scale;
            splatPoints.push({
              dx: Math.cos(angle) * distRadius,
              dy: Math.sin(angle) * distRadius,
              r: (3 + Math.random() * 5) * bug.scale,
            });
          }

          // Add stain decal: Starts wet, blemishes/dries, and vanishes within 4.5 seconds
          decalsRef.current.push({
            id: Math.random().toString(),
            x: bug.x,
            y: bug.y,
            color: speciesColors.wet,
            dryColor: speciesColors.dry,
            size: (isDirect ? 68 : 52) * bug.scale,
            rotation: Math.random() * Math.PI * 2,
            weapon,
            bornAt: Date.now(),
            lifespan: 4500, // 4.5 seconds timely removal
            splatPoints,
          });

          // Visceral Particle Burst
          const count = isDirect ? 16 : 9;
          for (let pIdx = 0; pIdx < count; pIdx++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 3 + Math.random() * 6;
            particlesRef.current.push({
              id: Math.random().toString(),
              x: bug.x,
              y: bug.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 2,
              color: speciesColors.wet,
              size: 2.5 + Math.random() * 4,
              life: 25,
              maxLife: 25,
            });
          }

          // Remove crushed bug
          bugs.splice(i, 1);
        } else {
          // Armored beetle damaged
          totalPointsAwarded += 100;
        }
      }
    }

    // Process butterfly strike penalty (1 life lost!)
    if (butterflyStruck) {
      playPenaltyAlarm();
      triggerHaptic(70);
      if (onButterflyHarm) {
        onButterflyHarm();
      }
    }

    if (hitCount > 0) {
      const remarks = [
        "CRITICAL STRIKE!",
        "BRUTAL SMASH!",
        "DIRECT HIT!",
        "INSTANT K.O.!",
        "CARAPACE CRUSHED!",
      ];
      const text = isDirect
        ? "PERFECT ANNIHILATION!"
        : remarks[Math.floor(Math.random() * remarks.length)];
      const subtext = totalPointsAwarded > 300 ? "⚡ LIGHTNING REFLEX 2x" : undefined;

      const normX = strikeX / canvas.width;
      const normY = strikeY / canvas.height;

      onHit({
        points: totalPointsAwarded,
        isCrit: isDirect,
        text,
        subtext,
        hitCount,
        killedAny,
        strikeX,
        strikeY,
        normX,
        normY,
        bugId: hitBugId,
      });
    } else if (!butterflyStruck) {
      // Missed swing!
      playMissWhoosh();
      onMiss();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isSpectating) return; // In spectator mode, first-person arm follows the spectated player's strikes
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    armRef.current.aimX = e.clientX - rect.left;
    armRef.current.aimY = e.clientY - rect.top;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none"
    />
  );
};

// -------------------------------------------------------------
// Canvas Drawing Helper Functions
// -------------------------------------------------------------

function drawTileFloor(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const tileSize = 64;
  // Matte studio ceramic base (light, natural, professional)
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  // Subtle clean grout grid (slate-200)
  ctx.strokeStyle = "rgba(226, 232, 240, 0.75)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = 0; x <= width; x += tileSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += tileSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Subtle interior tile edge highlight for depth
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x <= width; x += tileSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 1; y <= height; y += tileSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Clean soft ambient lighting vignette
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.4,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.95
  );
  grad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  grad.addColorStop(1, "rgba(15, 23, 42, 0.04)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Renders splat decals with drying / blemish effect and timely fade
 * - progress 0.0 - 0.25: Fresh wet shiny splat
 * - progress 0.25 - 0.75: Dries into a faint blemish stain, shrinking slightly
 * - progress 0.75 - 1.0: Fades out completely to keep floor clean!
 */
function drawDecal(ctx: CanvasRenderingContext2D, decal: CanvasDecal, progress: number) {
  ctx.save();
  ctx.translate(decal.x, decal.y);
  ctx.rotate(decal.rotation);

  // Drying and fading opacity calculation
  let opacity = 0.9;
  let scale = 1.0;

  if (progress > 0.3) {
    // Stain dries and blemishes
    const fadeT = (progress - 0.3) / 0.7; // 0 to 1
    opacity = Math.max(0, 0.9 * (1 - fadeT));
    scale = Math.max(0.75, 1.0 - fadeT * 0.2); // Shrinks as it dries
  }

  ctx.globalAlpha = opacity;
  ctx.scale(scale, scale);

  const r = decal.size / 2;
  const isDrying = progress > 0.25;
  const stainColor = isDrying ? decal.dryColor : decal.color;

  // Central impact splat pool
  ctx.fillStyle = stainColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Weapon-specific tread or mesh imprint
  if (decal.weapon === "shoe") {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let offset = -r * 0.5; offset <= r * 0.5; offset += r * 0.3) {
      ctx.fillRect(-r * 0.55, offset, r * 1.1, r * 0.12);
    }
  } else if (decal.weapon === "swatter") {
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-r * 0.8, -r * 0.6, r * 1.6, r * 1.2);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(0, r * 0.6);
    ctx.moveTo(-r * 0.8, 0);
    ctx.lineTo(r * 0.8, 0);
    ctx.stroke();
  }

  // Surrounding droplets
  if (!isDrying) {
    ctx.fillStyle = stainColor;
    for (const drop of decal.splatPoints) {
      ctx.beginPath();
      ctx.arc(drop.dx, drop.dy, drop.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Dispatches to realistic anatomically-detailed insect renderers
 */
function drawRealisticBug(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  ctx.save();
  ctx.translate(bug.x, bug.y);
  ctx.rotate(bug.angle);
  ctx.scale(bug.scale, bug.scale);

  // Realistic contact or flight shadow on floor
  if (bug.isFlying) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 24, bug.radius * 0.95, bug.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Subtle ambient occlusion under crawling bug
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 3, bug.radius * 0.8, bug.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (bug.species === "butterfly") {
    drawRealisticButterfly(ctx, bug);
  } else if (bug.species === "roach") {
    drawRealisticRoach(ctx, bug);
  } else if (bug.species === "fly") {
    drawRealisticFly(ctx, bug);
  } else if (bug.species === "beetle") {
    drawRealisticBeetle(ctx, bug);
  } else if (bug.species === "spider") {
    drawRealisticSpider(ctx, bug);
  } else if (bug.species === "golden") {
    drawRealisticGoldenBug(ctx, bug);
  } else {
    drawRealisticAnt(ctx, bug);
  }

  ctx.restore();
}

/**
 * Realistic Morpho / Monarch Butterfly
 * Features:
 * - Slender segmented thorax & abdomen
 * - Curved antennae with golden club tips
 * - 3D sinusoidal flapping wings with foreshortening
 * - Iridescent azure/indigo gradient with dark vein networks and marginal dots
 * - Soft glowing protected aura and "SAFE 🦋" floater badge
 */
function drawRealisticButterfly(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  const wiggle = bug.wigglePhase;
  // Sinusoidal 3D wing flap
  const flap = Math.cos(wiggle * 2.4);
  const wingFold = 0.2 + Math.abs(flap) * 0.8;

  // Ethereal protective glow aura around the protected butterfly
  ctx.save();
  ctx.shadowColor = "rgba(56, 189, 248, 0.65)";
  ctx.shadowBlur = 14;

  // Slender Thorax & Abdomen
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.ellipse(0, 3, 3.5, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head & Eyes
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(0, -12, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Curved Clubbed Antennae
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-1.5, -14);
  ctx.quadraticCurveTo(-8, -26, -14, -28);
  ctx.moveTo(1.5, -14);
  ctx.quadraticCurveTo(8, -26, 14, -28);
  ctx.stroke();

  // Golden tips
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(-14, -28, 2, 0, Math.PI * 2);
  ctx.arc(14, -28, 2, 0, Math.PI * 2);
  ctx.fill();

  // Left & Right Wings with 3D Flap Scale
  const drawWingPair = (side: 1 | -1) => {
    ctx.save();
    ctx.scale(side * wingFold, 1);

    // Forewing (Upper large wing) - Morpho Azure to Royal Indigo gradient
    const foreGrad = ctx.createRadialGradient(0, -2, 2, 20, -15, 34);
    foreGrad.addColorStop(0, "#e0f2fe");
    foreGrad.addColorStop(0.3, "#38bdf8");
    foreGrad.addColorStop(0.75, "#0284c7");
    foreGrad.addColorStop(1, "#0f172a");

    ctx.fillStyle = foreGrad;
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.bezierCurveTo(12, -32, 34, -28, 38, -10);
    ctx.bezierCurveTo(40, 2, 22, 6, 2, -2);
    ctx.closePath();
    ctx.fill();

    // Dark Wing Margin & Spots
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Delicate White Border Spots
    ctx.fillStyle = "#ffffff";
    const dots = [
      { x: 34, y: -16 },
      { x: 36, y: -8 },
      { x: 33, y: 0 },
    ];
    for (const dot of dots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hindwing (Lower rounded wing)
    const hindGrad = ctx.createRadialGradient(0, 5, 2, 16, 18, 26);
    hindGrad.addColorStop(0, "#7dd3fc");
    hindGrad.addColorStop(0.5, "#0284c7");
    hindGrad.addColorStop(0.9, "#1e1b4b");
    hindGrad.addColorStop(1, "#090d16");

    ctx.fillStyle = hindGrad;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.bezierCurveTo(24, 6, 32, 22, 16, 32);
    ctx.bezierCurveTo(4, 35, 1, 20, 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Delicate Veins on forewing
    ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(24, -14);
    ctx.moveTo(2, -6);
    ctx.lineTo(28, -6);
    ctx.moveTo(2, -6);
    ctx.lineTo(20, 2);
    ctx.stroke();

    ctx.restore();
  };

  drawWingPair(1);
  drawWingPair(-1);

  ctx.restore();

  // Soft "SAFE 🦋" indicator tag floating above
  ctx.save();
  ctx.rotate(-bug.angle); // Keep badge upright
  ctx.translate(0, -34);
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-28, -10, 56, 18, 9);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SAFE 🦋", 0, 0);
  ctx.restore();
}

// -------------------------------------------------------------
// REALISTIC INSECT RENDERERS (True Chitin Anatomy & Realism)
// -------------------------------------------------------------

/**
 * Realistic German Cockroach (Blattella germanica)
 * Features:
 * - Pronotum with dual dark longitudinal stripes
 * - Chitin tegmina (wings) with venation and oily amber gradient
 * - Long filiform curving antennae that twitch organically
 * - 6 articulated spiny legs with realistic coxa, femur, spiny tibia, and tarsus
 * - Cerci feelers at the rear
 */
function drawRealisticRoach(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  const wiggle = Math.sin(bug.wigglePhase) * 5;
  const legCycle = Math.cos(bug.wigglePhase);

  // 1. Jointed Spiny Legs (Realistic Tripod Gait)
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const legPairs = [
    // Front pair (angled forward)
    { baseX: 8, baseY: -10, midX: 20 + wiggle, midY: -22, tipX: 30 + wiggle, tipY: -26 },
    { baseX: -8, baseY: -10, midX: -20 - wiggle, midY: -22, tipX: -30 - wiggle, tipY: -26 },
    // Middle pair
    { baseX: 11, baseY: 2, midX: 26 - wiggle, midY: 4, tipX: 36 - wiggle, tipY: 6 },
    { baseX: -11, baseY: 2, midX: -26 + wiggle, midY: 4, tipX: -36 + wiggle, tipY: 6 },
    // Rear pair (longest, angled backward)
    { baseX: 9, baseY: 14, midX: 26 + wiggle, midY: 26, tipX: 38 + wiggle, tipY: 38 },
    { baseX: -9, baseY: 14, midX: -26 - wiggle, midY: 26, tipX: -38 - wiggle, tipY: 38 },
  ];

  ctx.beginPath();
  for (const leg of legPairs) {
    ctx.moveTo(leg.baseX, leg.baseY);
    ctx.lineTo(leg.midX, leg.midY);
    ctx.lineTo(leg.tipX, leg.tipY);
  }
  ctx.stroke();

  // Tibial Spine Barbs on rear legs
  ctx.strokeStyle = "#290e02";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(22 + wiggle, 22);
  ctx.lineTo(26 + wiggle, 20);
  ctx.moveTo(-22 - wiggle, 22);
  ctx.lineTo(-26 - wiggle, 20);
  ctx.stroke();

  // 2. Rear Cerci (Sensory Pincers at tail)
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-4, 25);
  ctx.lineTo(-9, 34);
  ctx.moveTo(4, 25);
  ctx.lineTo(9, 34);
  ctx.stroke();

  // 3. Abdomen (Segmented Tergites under wings)
  ctx.fillStyle = "#3e1903";
  ctx.beginPath();
  ctx.ellipse(0, 8, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Tegmina Wings (Layered Amber Carapace)
  const wingGrad = ctx.createLinearGradient(-10, -5, 10, 24);
  wingGrad.addColorStop(0, "#92400e");
  wingGrad.addColorStop(0.5, "#78350f");
  wingGrad.addColorStop(1, "#451a03");
  ctx.fillStyle = wingGrad;

  ctx.beginPath();
  ctx.ellipse(0, 6, 11, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing suture line & subtle venation
  ctx.strokeStyle = "rgba(41, 14, 2, 0.6)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 24);
  ctx.stroke();

  // Translucent chitin edge highlight
  ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 6, 9.5, 18.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Pronotum (Shield behind head with distinct twin dark stripes)
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.ellipse(0, -11, 9, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Twin German Cockroach dark stripes on pronotum
  ctx.fillStyle = "#271202";
  ctx.beginPath();
  ctx.ellipse(-3.5, -11, 1.8, 5.5, -0.15, 0, Math.PI * 2);
  ctx.ellipse(3.5, -11, 1.8, 5.5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 6. Head & Mouthparts
  ctx.fillStyle = "#3e1903";
  ctx.beginPath();
  ctx.ellipse(0, -18, 5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Compound Eyes
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.arc(-4, -18, 1.6, 0, Math.PI * 2);
  ctx.arc(4, -18, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // 7. Long Curving Whip-like Antennae with dynamic twitching
  ctx.strokeStyle = "#9a3412";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-2, -21);
  ctx.quadraticCurveTo(-16 + wiggle * 0.5, -34, -28 + wiggle * 1.5, -42);
  ctx.moveTo(2, -21);
  ctx.quadraticCurveTo(16 - wiggle * 0.5, -34, 28 - wiggle * 1.5, -42);
  ctx.stroke();
}

/**
 * Realistic Housefly / Blowfly (Musca domestica)
 * Features:
 * - Huge multifaceted ruby compound eyes with specular glint
 * - Thorax with realistic bristles and dark thoracic stripes
 * - Translucent iridescent wings with authentic micro-venation (costa, radial veins)
 * - Motion-blurred flutter effect
 * - Arched black jointed legs
 */
function drawRealisticFly(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  const flutter = Math.sin(bug.wigglePhase * 4) * 0.45;
  const wingAngle = 0.35 + flutter;

  // 1. Jointed Spiny Legs
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  // Front legs
  ctx.moveTo(-6, -4);
  ctx.lineTo(-18, -12);
  ctx.lineTo(-24, -8);
  ctx.moveTo(6, -4);
  ctx.lineTo(18, -12);
  ctx.lineTo(24, -8);
  // Middle legs
  ctx.moveTo(-7, 2);
  ctx.lineTo(-20, 4);
  ctx.lineTo(-26, 12);
  ctx.moveTo(7, 2);
  ctx.lineTo(20, 4);
  ctx.lineTo(26, 12);
  // Rear legs
  ctx.moveTo(-6, 8);
  ctx.lineTo(-18, 18);
  ctx.lineTo(-22, 24);
  ctx.moveTo(6, 8);
  ctx.lineTo(18, 18);
  ctx.lineTo(22, 24);
  ctx.stroke();

  // 2. Abdomen (Metallic Greenish-Black Chitin with segments)
  const abdGrad = ctx.createLinearGradient(0, 2, 0, 20);
  abdGrad.addColorStop(0, "#1e293b");
  abdGrad.addColorStop(0.5, "#0f172a");
  abdGrad.addColorStop(1, "#020617");
  ctx.fillStyle = abdGrad;

  ctx.beginPath();
  ctx.ellipse(0, 10, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Abdominal Segment Grooves
  ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(8, 6);
  ctx.moveTo(-9, 11);
  ctx.lineTo(9, 11);
  ctx.moveTo(-7, 16);
  ctx.lineTo(7, 16);
  ctx.stroke();

  // 3. Thorax (Striped Charcoal Chitin)
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.ellipse(0, -2, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thoracic longitudinal stripes
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-5, -8, 2, 10);
  ctx.fillRect(3, -8, 2, 10);
  ctx.fillRect(-1.5, -8, 3, 10);

  // 4. Realistic Translucent Wings with Detailed Vein Network
  const drawWing = (side: 1 | -1) => {
    ctx.save();
    ctx.translate(side * 5, -3);
    ctx.rotate(side * wingAngle);

    // Wing membrane
    ctx.fillStyle = "rgba(224, 242, 254, 0.55)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.ellipse(side * 12, 10, 8, 19, side * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wing Veins (Costa, Radius, Cross-veins)
    ctx.strokeStyle = "rgba(2, 132, 199, 0.75)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 10, 26);
    ctx.moveTo(0, 2);
    ctx.lineTo(side * 14, 18);
    ctx.moveTo(side * 6, 8);
    ctx.lineTo(side * 12, 6);
    ctx.stroke();

    ctx.restore();
  };

  drawWing(-1);
  drawWing(1);

  // 5. Head & Massive Ruby Compound Eyes
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(0, -9, 5, 0, Math.PI * 2);
  ctx.fill();

  // Huge compound eyes taking up most of head
  const eyeGrad = ctx.createRadialGradient(-4, -11, 1, -4, -10, 4.5);
  eyeGrad.addColorStop(0, "#ef4444");
  eyeGrad.addColorStop(0.7, "#991b1b");
  eyeGrad.addColorStop(1, "#450a0a");
  ctx.fillStyle = eyeGrad;

  // Left Eye
  ctx.beginPath();
  ctx.arc(-4.5, -10, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Right Eye
  ctx.beginPath();
  ctx.arc(4.5, -10, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Specular Eye Highlights (Glossy 3D reflection)
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.beginPath();
  ctx.arc(-5.2, -11.5, 1.2, 0, Math.PI * 2);
  ctx.arc(3.8, -11.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Realistic Armored Ground / Rhinoceros Beetle (Carabidae)
 * Features:
 * - Highly polished obsidian/emerald chitin with 3D convex specular highlights
 * - Central suture line and longitudinal punctured striae
 * - Curving thoracic/mandibular horns
 * - Muscular articulated digging legs with sharp tibial spurs
 */
function drawRealisticBeetle(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  const wiggle = Math.sin(bug.wigglePhase) * 4;

  // 1. Heavy Articulated Digging Legs
  ctx.strokeStyle = "#022c22";
  ctx.lineWidth = 3.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Front legs
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(-24 - wiggle, -16);
  ctx.lineTo(-32 - wiggle, -10);
  ctx.moveTo(10, -8);
  ctx.lineTo(24 + wiggle, -16);
  ctx.lineTo(32 + wiggle, -10);
  // Middle legs
  ctx.moveTo(-12, 4);
  ctx.lineTo(-28 + wiggle, 6);
  ctx.lineTo(-36 + wiggle, 14);
  ctx.moveTo(12, 4);
  ctx.lineTo(28 - wiggle, 6);
  ctx.lineTo(36 - wiggle, 14);
  // Rear legs
  ctx.moveTo(-11, 16);
  ctx.lineTo(-26 - wiggle, 24);
  ctx.lineTo(-34 - wiggle, 34);
  ctx.moveTo(11, 16);
  ctx.lineTo(26 + wiggle, 24);
  ctx.lineTo(34 + wiggle, 34);
  ctx.stroke();

  // Tibial Digging Spurs
  ctx.strokeStyle = "#064e3b";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-24 - wiggle, -16);
  ctx.lineTo(-28 - wiggle, -20);
  ctx.moveTo(24 + wiggle, -16);
  ctx.lineTo(28 + wiggle, -20);
  ctx.stroke();

  // 2. Heavy Elytra Carapace (Wing Covers)
  const shellGrad = ctx.createLinearGradient(-15, 0, 15, 20);
  shellGrad.addColorStop(0, "#022c22");
  shellGrad.addColorStop(0.3, "#065f46");
  shellGrad.addColorStop(0.8, "#022c22");
  shellGrad.addColorStop(1, "#011c15");
  ctx.fillStyle = shellGrad;

  ctx.beginPath();
  ctx.ellipse(0, 8, 17, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  // Central Elytral Suture Line
  ctx.strokeStyle = "#011c15";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 28);
  ctx.stroke();

  // Striae (Longitudinal Grooves along shell)
  ctx.strokeStyle = "rgba(4, 120, 87, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-6, 24);
  ctx.moveTo(6, -8);
  ctx.lineTo(6, 24);
  ctx.moveTo(-11, -2);
  ctx.lineTo(-11, 18);
  ctx.moveTo(11, -2);
  ctx.lineTo(11, 18);
  ctx.stroke();

  // 3D Specular Curved Highlight (Gleaming polished shell)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-6, 6, 8, -Math.PI * 0.7, -Math.PI * 0.1);
  ctx.stroke();

  // 3. Pronotum (Broad Neck Shield)
  ctx.fillStyle = "#022c22";
  ctx.beginPath();
  ctx.ellipse(0, -14, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Head & Horn / Mandibles
  ctx.fillStyle = "#011c15";
  ctx.beginPath();
  ctx.ellipse(0, -22, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Curved Rhinoceros Horn / Mandibles
  ctx.strokeStyle = "#022c22";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-3, -25);
  ctx.quadraticCurveTo(-6, -34, -4, -38);
  ctx.moveTo(3, -25);
  ctx.quadraticCurveTo(6, -34, 4, -38);
  ctx.stroke();

  // Damage Crack if damaged
  if (bug.hp < bug.maxHp) {
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 6);
    ctx.lineTo(-2, 14);
    ctx.stroke();
  }
}

/**
 * Realistic Spider (Wolf Spider / Black Widow style)
 * Features:
 * - Cephalothorax and bulbous abdomen with pedicel (waist)
 * - 8 jointed, arched legs with realistic multi-joint articulation
 * - Ocular cluster with glistening eyes
 * - Chelicerae (curved fangs) and pedipalps
 */
function drawRealisticSpider(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  const wiggle = Math.sin(bug.wigglePhase) * 4;

  // 1. 8 Articulated Arched Legs (Connecting strictly to cephalothorax!)
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const legPairs = [
    // Leg Pair 1 (Forward Reach)
    { side: 1, x1: 5, y1: -8, x2: 18 + wiggle, y2: -24, x3: 26 + wiggle, y3: -28 },
    { side: -1, x1: -5, y1: -8, x2: -18 - wiggle, y2: -24, x3: -26 - wiggle, y3: -28 },
    // Leg Pair 2 (Forward-Lateral)
    { side: 1, x1: 7, y1: -4, x2: 24 - wiggle, y2: -12, x3: 32 - wiggle, y3: -8 },
    { side: -1, x1: -7, y1: -4, x2: -24 + wiggle, y2: -12, x3: -32 + wiggle, y3: -8 },
    // Leg Pair 3 (Lateral-Rear)
    { side: 1, x1: 7, y1: 2, x2: 26 + wiggle, y2: 6, x3: 34 + wiggle, y3: 16 },
    { side: -1, x1: -7, y1: 2, x2: -26 - wiggle, y2: 6, x3: -34 - wiggle, y3: 16 },
    // Leg Pair 4 (Rear Anchor)
    { side: 1, x1: 5, y1: 6, x2: 22 - wiggle, y2: 22, x3: 28 - wiggle, y3: 34 },
    { side: -1, x1: -5, y1: 6, x2: -22 + wiggle, y2: 22, x3: -28 + wiggle, y3: 34 },
  ];

  ctx.beginPath();
  for (const leg of legPairs) {
    ctx.moveTo(leg.x1, leg.y1);
    ctx.lineTo(leg.x2, leg.y2);
    ctx.lineTo(leg.x3, leg.y3);
  }
  ctx.stroke();

  // 2. Pedipalps (Front feelers)
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-3, -13);
  ctx.lineTo(-8, -20);
  ctx.moveTo(3, -13);
  ctx.lineTo(8, -20);
  ctx.stroke();

  // 3. Bulbous Abdomen (Opisthosoma)
  const abdGrad = ctx.createRadialGradient(0, 10, 2, 0, 11, 14);
  abdGrad.addColorStop(0, "#27272a");
  abdGrad.addColorStop(0.7, "#09090b");
  abdGrad.addColorStop(1, "#000000");
  ctx.fillStyle = abdGrad;

  ctx.beginPath();
  ctx.ellipse(0, 12, 13, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hourglass / Wolf chevron marking
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(4, 11);
  ctx.lineTo(0, 14);
  ctx.lineTo(-4, 11);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(5, 19);
  ctx.lineTo(-5, 19);
  ctx.closePath();
  ctx.fill();

  // 4. Pedicel (Narrow Waist connection)
  ctx.fillStyle = "#18181b";
  ctx.fillRect(-2.5, -2, 5, 4);

  // 5. Cephalothorax (Prosoma)
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.ellipse(0, -6, 8, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 6. Cluster of 8 Eyes
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  // 2 Median Eyes
  ctx.arc(-2, -9, 1.4, 0, Math.PI * 2);
  ctx.arc(2, -9, 1.4, 0, Math.PI * 2);
  // Lateral Eyes
  ctx.arc(-4.5, -8, 1, 0, Math.PI * 2);
  ctx.arc(4.5, -8, 1, 0, Math.PI * 2);
  ctx.fill();

  // Eye Specular Highlight
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-2.3, -9.4, 0.5, 0, Math.PI * 2);
  ctx.arc(1.7, -9.4, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Realistic Carpenter Ant (Camponotus pennsylvanicus)
 * Features:
 * - Anatomically accurate 3-segment body: Head, Mesosoma, Gaster with Petiole waist node
 * - Biting mandibles and elbowed antennae
 * - 6 long jointed legs attached to thorax
 */
function drawRealisticAnt(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  const wiggle = Math.sin(bug.wigglePhase) * 4;

  // 1. 6 Spindly Jointed Legs (Originating from Mesosoma)
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";

  ctx.beginPath();
  // Front
  ctx.moveTo(-4, -4);
  ctx.lineTo(-16 - wiggle, -14);
  ctx.lineTo(-24 - wiggle, -18);
  ctx.moveTo(4, -4);
  ctx.lineTo(16 + wiggle, -14);
  ctx.lineTo(24 + wiggle, -18);
  // Middle
  ctx.moveTo(-4, 0);
  ctx.lineTo(-18 + wiggle, 2);
  ctx.lineTo(-26 + wiggle, 8);
  ctx.moveTo(4, 0);
  ctx.lineTo(18 - wiggle, 2);
  ctx.lineTo(26 - wiggle, 8);
  // Rear
  ctx.moveTo(-4, 4);
  ctx.lineTo(-18 - wiggle, 14);
  ctx.lineTo(-26 - wiggle, 24);
  ctx.moveTo(4, 4);
  ctx.lineTo(18 + wiggle, 14);
  ctx.lineTo(26 + wiggle, 24);
  ctx.stroke();

  // 2. Gaster (Pointed Segmented Abdomen)
  ctx.fillStyle = "#09090b";
  ctx.beginPath();
  ctx.ellipse(0, 13, 9, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gaster Chitin Rings
  ctx.strokeStyle = "rgba(63, 63, 70, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-7, 9);
  ctx.lineTo(7, 9);
  ctx.moveTo(-8, 14);
  ctx.lineTo(8, 14);
  ctx.moveTo(-6, 19);
  ctx.lineTo(6, 19);
  ctx.stroke();

  // 3. Petiole Node (Distinct waist hump)
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.arc(0, 4, 3, 0, Math.PI * 2);
  ctx.fill();

  // 4. Mesosoma (Thorax)
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.ellipse(0, -1, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Head & Mandibles
  ctx.fillStyle = "#09090b";
  ctx.beginPath();
  ctx.ellipse(0, -13, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Serrated Mandibles
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-4, -18);
  ctx.lineTo(-2, -22);
  ctx.moveTo(4, -18);
  ctx.lineTo(2, -22);
  ctx.stroke();

  // 6. Elbowed (Geniculate) Antennae
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-3, -16);
  ctx.lineTo(-11, -24);
  ctx.lineTo(-18 + wiggle, -22);
  ctx.moveTo(3, -16);
  ctx.lineTo(11, -24);
  ctx.lineTo(18 - wiggle, -22);
  ctx.stroke();
}

/**
 * Realistic Golden Hornet / Mutant Bug
 */
function drawRealisticGoldenBug(ctx: CanvasRenderingContext2D, bug: CanvasBug) {
  const wiggle = Math.sin(bug.wigglePhase) * 5;

  ctx.shadowColor = "#f59e0b";
  ctx.shadowBlur = 16;

  // Golden Legs
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.lineTo(-22 - wiggle, -14);
  ctx.moveTo(7, -4);
  ctx.lineTo(22 + wiggle, -14);
  ctx.moveTo(-8, 4);
  ctx.lineTo(-24 + wiggle, 8);
  ctx.moveTo(8, 4);
  ctx.lineTo(24 - wiggle, 8);
  ctx.moveTo(-7, 12);
  ctx.lineTo(-22 - wiggle, 24);
  ctx.moveTo(7, 12);
  ctx.lineTo(22 + wiggle, 24);
  ctx.stroke();

  // Striped Golden & Black Abdomen
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Black Wasp Stripes
  ctx.fillStyle = "#09090b";
  ctx.fillRect(-10, 4, 20, 3);
  ctx.fillRect(-11, 10, 22, 3);
  ctx.fillRect(-9, 16, 18, 3);

  // Thorax & Head
  ctx.fillStyle = "#d97706";
  ctx.beginPath();
  ctx.ellipse(0, -4, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#92400e";
  ctx.beginPath();
  ctx.ellipse(0, -14, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stinger
  ctx.fillStyle = "#09090b";
  ctx.beginPath();
  ctx.moveTo(-2, 26);
  ctx.lineTo(2, 26);
  ctx.lineTo(0, 32);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
}

function updateAndDrawArm(
  ctx: CanvasRenderingContext2D,
  arm: ArmAnimation,
  weapon: WeaponType,
  width: number,
  height: number,
  dt: number
) {
  const baseX = width * 0.78;
  const baseY = height + 40;
  const now = performance.now();

  // Natural idle resting position with subtle breathing sway
  const swayX = Math.sin(now * 0.0025) * 5;
  const swayY = Math.cos(now * 0.0025) * 3;
  const idleX = width * 0.72 - 45 + swayX;
  const idleY = height - 85 + swayY;

  // Aim direction when idle
  const aimDx = arm.aimX - idleX;
  const aimDy = arm.aimY - idleY;
  const idleAngle = Math.atan2(aimDy, aimDx) + Math.PI / 2;

  let currentX = idleX;
  let currentY = idleY;
  let angle = idleAngle;
  let isImpact = false;
  let squashX = 1;
  let squashY = 1;

  // Step safe delta
  const safeDt = Math.min(dt, 0.05);

  if (arm.active) {
    arm.timer += safeDt;

    if (arm.phase === "windup") {
      const dur = 0.045;
      const t = Math.min(1, arm.timer / dur);
      // Interpolate from start to windup position
      currentX = arm.startX + (arm.windupX - arm.startX) * t;
      currentY = arm.startY + (arm.windupY - arm.startY) * t;
      // Cock weapon backwards
      angle = idleAngle - 0.45 * t;

      if (arm.timer >= dur) {
        arm.phase = "slam";
        arm.timer = 0;
        arm.progress = 0;
      }
    } else if (arm.phase === "slam") {
      const dur = 0.065;
      const t = Math.min(1, arm.timer / dur);
      // Cubic acceleration into the smash
      const ease = t * t * t;
      currentX = arm.windupX + (arm.targetX - arm.windupX) * ease;
      currentY = arm.windupY + (arm.targetY - arm.windupY) * ease;

      const strikeDx = arm.targetX - arm.windupX;
      const strikeDy = arm.targetY - arm.windupY;
      angle = Math.atan2(strikeDy, strikeDx) + Math.PI / 2;

      // Add swoosh trail point
      arm.trail.push({ x: currentX, y: currentY, angle, alpha: 0.85 });

      if (arm.timer >= dur) {
        arm.phase = "impact";
        arm.timer = 0;
        arm.squashX = 1.24;
        arm.squashY = 0.82;
      }
    } else if (arm.phase === "impact") {
      const dur = 0.06;
      currentX = arm.targetX;
      currentY = arm.targetY;

      const strikeDx = arm.targetX - arm.windupX;
      const strikeDy = arm.targetY - arm.windupY;
      angle = Math.atan2(strikeDy, strikeDx) + Math.PI / 2;

      isImpact = true;
      squashX = arm.squashX;
      squashY = arm.squashY;

      if (arm.timer >= dur) {
        arm.phase = "recover";
        arm.timer = 0;
        arm.squashX = 1;
        arm.squashY = 1;
      }
    } else if (arm.phase === "recover") {
      const dur = 0.12;
      const t = Math.min(1, arm.timer / dur);
      // Smooth elastic recovery back to idle stance
      const ease = 1 - Math.pow(1 - t, 3);
      currentX = arm.targetX + (idleX - arm.targetX) * ease;
      currentY = arm.targetY + (idleY - arm.targetY) * ease;

      const strikeDx = arm.targetX - arm.windupX;
      const strikeDy = arm.targetY - arm.windupY;
      const impactAngle = Math.atan2(strikeDy, strikeDx) + Math.PI / 2;
      angle = impactAngle + (idleAngle - impactAngle) * ease;

      if (arm.timer >= dur) {
        arm.phase = "idle";
        arm.active = false;
        arm.trail = [];
      }
    }
  } else {
    // Keep reference of current position for smooth attack startup
    arm.startX = currentX;
    arm.startY = currentY;
  }

  // 1. Draw Kinetic Motion Swoosh Blur (Speed trail)
  if (arm.trail.length > 1) {
    ctx.save();
    for (let i = 0; i < arm.trail.length - 1; i++) {
      const p1 = arm.trail[i];
      const p2 = arm.trail[i + 1];
      const trailAlpha = (i / arm.trail.length) * 0.55;

      ctx.strokeStyle =
        weapon === "swatter"
          ? `rgba(250, 204, 21, ${trailAlpha})`
          : weapon === "shoe"
          ? `rgba(234, 88, 12, ${trailAlpha})`
          : `rgba(255, 255, 255, ${trailAlpha})`;
      ctx.lineWidth = 14 + (i / arm.trail.length) * 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();

    // Decay trail points
    for (let i = arm.trail.length - 1; i >= 0; i--) {
      arm.trail[i].alpha -= safeDt * 6;
      if (arm.trail[i].alpha <= 0) {
        arm.trail.splice(i, 1);
      }
    }
  }

  // 2. Draw Realistic Human Forearm
  ctx.save();
  const armMidX = (baseX + currentX) / 2 + 15;
  const armMidY = (baseY + currentY) / 2 + 8;

  // Forearm drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.moveTo(baseX - 42, baseY + 6);
  ctx.quadraticCurveTo(armMidX + 10, armMidY + 14, currentX - 14, currentY + 24);
  ctx.lineTo(currentX + 24, currentY + 24);
  ctx.quadraticCurveTo(armMidX + 30, armMidY + 14, baseX + 42, baseY + 6);
  ctx.closePath();
  ctx.fill();

  // Forearm Flesh Gradient
  const armGrad = ctx.createLinearGradient(baseX - 35, baseY, currentX, currentY);
  armGrad.addColorStop(0, "#d4a373");
  armGrad.addColorStop(0.5, "#e0a97d");
  armGrad.addColorStop(1, "#c68b59");

  ctx.fillStyle = armGrad;
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(baseX - 38, baseY);
  ctx.quadraticCurveTo(armMidX - 10, armMidY, currentX - 16, currentY + 16);
  ctx.lineTo(currentX + 18, currentY + 16);
  ctx.quadraticCurveTo(armMidX + 20, armMidY, baseX + 38, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dark Sleeve Cuff at Base
  ctx.fillStyle = "#0f172a";
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(baseX, baseY - 6, 42, 16, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Clenched Fist Hand & Weapon Rendering
  ctx.translate(currentX, currentY);
  ctx.rotate(angle);

  // Draw the custom Weapon Head
  drawWeaponHead(ctx, weapon, isImpact, squashX, squashY, now);

  // Clenched Fist Knuckles holding the weapon
  ctx.fillStyle = "#e0a97d";
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-16, 2, 32, 22, [6]);
  ctx.fill();
  ctx.stroke();

  // Finger Knuckle lines
  ctx.beginPath();
  ctx.moveTo(-8, 3);
  ctx.lineTo(-8, 23);
  ctx.moveTo(0, 3);
  ctx.lineTo(0, 23);
  ctx.moveTo(8, 3);
  ctx.lineTo(8, 23);
  ctx.stroke();

  // Thumb folded across grip
  ctx.fillStyle = "#d4a373";
  ctx.beginPath();
  ctx.roundRect(-14, 12, 26, 9, [4]);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawWeaponHead(
  ctx: CanvasRenderingContext2D,
  weapon: WeaponType,
  isImpact: boolean,
  squashX: number,
  squashY: number,
  time: number
) {
  if (weapon === "shoe") {
    drawCoralFlipFlop(ctx, isImpact, squashX, squashY);
  } else if (weapon === "newspaper") {
    drawRolledNewspaper(ctx, isImpact, squashX, squashY);
  } else {
    drawElectricBugRacket(ctx, isImpact, squashX, squashY, time);
  }
}

// -------------------------------------------------------------
// Weapon 1: Coral Flip-Flop (Matching Screenshot 3)
// -------------------------------------------------------------
function drawCoralFlipFlop(
  ctx: CanvasRenderingContext2D,
  isImpact: boolean,
  squashX: number,
  squashY: number
) {
  ctx.save();
  ctx.scale(squashX, squashY);

  // Ground drop shadow
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 26, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Anatomical Flip-Flop Sole Path matching Screenshot 3
  const drawSolePath = () => {
    ctx.beginPath();
    ctx.moveTo(0, -78);
    // Right side down to arch
    ctx.bezierCurveTo(24, -78, 27, -50, 25, -25);
    // Arch indentation into heel
    ctx.bezierCurveTo(23, -5, 26, 12, 20, 24);
    // Heel curve
    ctx.bezierCurveTo(12, 32, -12, 32, -20, 24);
    // Left heel to arch
    ctx.bezierCurveTo(-26, 12, -23, -5, -25, -25);
    // Left arch to toe
    ctx.bezierCurveTo(-27, -50, -24, -78, 0, -78);
    ctx.closePath();
  };

  // 1. Dark Red/Terracotta Outer Rim
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#7f1d1d";
  ctx.fillStyle = "#991b1b";
  drawSolePath();
  ctx.fill();
  ctx.stroke();

  // 2. White Sandwich Layer Stripe
  ctx.save();
  ctx.scale(0.96, 0.96);
  ctx.fillStyle = "#ffffff";
  drawSolePath();
  ctx.fill();

  // 3. Coral-Red Footbed
  ctx.scale(0.95, 0.95);
  ctx.fillStyle = "#eb5743";
  drawSolePath();
  ctx.fill();

  // 4. Textured Horizontal Grip Ridges
  ctx.fillStyle = "#f87171";
  ctx.strokeStyle = "#b91c1c";
  ctx.lineWidth = 1;
  const ridgeY = [-55, -45, -35, -25, -15, -5, 5, 15];
  for (const ry of ridgeY) {
    const rw = 26 - Math.abs(ry + 20) * 0.18;
    ctx.beginPath();
    ctx.roundRect(-rw / 2, ry, rw, 3.2, [1.6]);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 5. Yellow V-Strap (Thong) with Navy Toe Post
  // Dark navy toe post plug
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.ellipse(0, -56, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Banana-Yellow V-Strap
  ctx.lineWidth = 6.5;
  ctx.strokeStyle = "#facc15";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Left strap
  ctx.beginPath();
  ctx.moveTo(0, -54);
  ctx.quadraticCurveTo(-18, -32, -22, -2);
  ctx.stroke();

  // Right strap
  ctx.beginPath();
  ctx.moveTo(0, -54);
  ctx.quadraticCurveTo(18, -32, 22, -2);
  ctx.stroke();

  // Strap Highlight
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#fef08a";
  ctx.beginPath();
  ctx.moveTo(0, -54);
  ctx.quadraticCurveTo(-17, -32, -20, -2);
  ctx.moveTo(0, -54);
  ctx.quadraticCurveTo(17, -32, 20, -2);
  ctx.stroke();

  // Joint Cap
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.arc(0, -54, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Impact Shockwave Ring on Floor
  if (isImpact) {
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, -25, 42, 70, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Weapon 2: Rolled Newspaper (Matching Screenshot 2)
// -------------------------------------------------------------
function drawRolledNewspaper(
  ctx: CanvasRenderingContext2D,
  isImpact: boolean,
  squashX: number,
  squashY: number
) {
  ctx.save();
  ctx.scale(squashX, squashY);
  ctx.rotate(-0.25);

  // Ground drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 24, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back Fanned Grey Pages
  ctx.fillStyle = "#cbd5e1";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -75);
  ctx.lineTo(16, -88);
  ctx.lineTo(24, -45);
  ctx.lineTo(5, -40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(-4, -76);
  ctx.lineTo(26, -82);
  ctx.lineTo(28, -35);
  ctx.lineTo(8, -32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Main White Rolled Paper Cylinder
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-22, -62);
  ctx.lineTo(8, -75);
  ctx.lineTo(20, 24);
  ctx.lineTo(-12, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Top Folded Flap with "NEWS" Banner
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-24, -62);
  ctx.bezierCurveTo(-16, -74, 0, -78, 12, -74);
  ctx.lineTo(6, -56);
  ctx.bezierCurveTo(-4, -60, -16, -56, -20, -50);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.stroke();

  // "NEWS" Header Text
  ctx.translate(-10, -64);
  ctx.rotate(-0.25);
  ctx.fillStyle = "#000000";
  ctx.font = "900 11px Impact, Arial Black, sans-serif";
  ctx.fillText("NEWS", -12, 3);
  ctx.restore();

  // Column Layout and Printed Text Lines
  ctx.fillStyle = "#334155";
  ctx.fillRect(-12, -50, 22, 3.5);

  // Double text columns
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const y = -42 + i * 5;
    ctx.beginPath();
    ctx.moveTo(-14, y);
    ctx.lineTo(-3, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, y);
    ctx.lineTo(14, y);
    ctx.stroke();
  }

  // Section divider rule
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-14, -8);
  ctx.lineTo(15, -8);
  ctx.stroke();

  // Lower Paragraph text lines
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const y = -3 + i * 5;
    ctx.beginPath();
    ctx.moveTo(-12, y);
    ctx.lineTo(14, y);
    ctx.stroke();
  }

  // Rolled bottom cylinder curl
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(4, 28, 16, 0.4, Math.PI * 0.9);
  ctx.stroke();

  // Sharp Whip-Crack Impact Lines
  if (isImpact) {
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-35, -40);
    ctx.lineTo(-48, -55);
    ctx.moveTo(35, -30);
    ctx.lineTo(50, -45);
    ctx.moveTo(-20, 38);
    ctx.lineTo(-34, 52);
    ctx.stroke();
  }

  ctx.restore();
}

// -------------------------------------------------------------
// Weapon 3: Electric Bug Racket (Matching Screenshot 1)
// -------------------------------------------------------------
function drawElectricBugRacket(
  ctx: CanvasRenderingContext2D,
  isImpact: boolean,
  squashX: number,
  squashY: number,
  _time: number
) {
  ctx.save();
  ctx.scale(squashX, squashY);

  // Ground drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 15, 26, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dimensions of Head Frame
  const headW = 58;
  const headH = 68;
  const headY = -58;

  // Outer Canary-Yellow Frame
  ctx.fillStyle = "#eab308";
  ctx.strokeStyle = "#ca8a04";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-headW / 2, headY - headH / 2, headW, headH, [18]);
  ctx.fill();
  ctx.stroke();

  // Inner Crimson/Red Backplate (as in Screenshot 1)
  const innerW = 44;
  const innerH = 54;
  ctx.fillStyle = "#991b1b";
  ctx.beginPath();
  ctx.roundRect(-innerW / 2, headY - innerH / 2, innerW, innerH, [12]);
  ctx.fill();

  // Yellow Electric Mesh Grid
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  // Horizontal wires
  for (let y = headY - innerH / 2 + 7; y < headY + innerH / 2; y += 7.5) {
    ctx.moveTo(-innerW / 2 + 2, y);
    ctx.lineTo(innerW / 2 - 2, y);
  }
  // Vertical wires
  for (let x = -innerW / 2 + 7; x < innerW / 2; x += 7.5) {
    ctx.moveTo(x, headY - innerH / 2 + 2);
    ctx.lineTo(x, headY + innerH / 2 - 2);
  }
  ctx.stroke();

  // Yellow Neck Socket
  ctx.fillStyle = "#eab308";
  ctx.strokeStyle = "#ca8a04";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, headY + headH / 2 - 1);
  ctx.lineTo(10, headY + headH / 2 - 1);
  ctx.lineTo(7, headY + headH / 2 + 8);
  ctx.lineTo(-7, headY + headH / 2 + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White Cylindrical Handle Shaft
  const handleTop = headY + headH / 2 + 8;
  const handleH = 45;
  const handleW = 11;
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-handleW / 2, handleTop, handleW, handleH, [3]);
  ctx.fill();
  ctx.stroke();

  // Center Yellow Oval Power Switch Button
  ctx.fillStyle = "#facc15";
  ctx.strokeStyle = "#ca8a04";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-2.5, handleTop + 14, 5, 12, [2.5]);
  ctx.fill();
  ctx.stroke();

  // Switch Toggle Notch
  ctx.fillStyle = "#78350f";
  ctx.beginPath();
  ctx.arc(0, handleTop + 20, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Flared Yellow Pommel Base
  ctx.fillStyle = "#eab308";
  ctx.strokeStyle = "#ca8a04";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, handleTop + handleH);
  ctx.lineTo(8, handleTop + handleH);
  ctx.lineTo(10, handleTop + handleH + 8);
  ctx.lineTo(-10, handleTop + handleH + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // High-Voltage Lightning Sparks on Impact
  if (isImpact) {
    ctx.save();
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 10;

    const sparkAngles = [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6];
    for (const a of sparkAngles) {
      const sx = Math.cos(a) * 14;
      const sy = headY + Math.sin(a) * 14;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a) * 22 + (Math.random() - 0.5) * 8, sy + Math.sin(a) * 22);
      ctx.lineTo(sx + Math.cos(a) * 38, sy + Math.sin(a) * 38);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}
