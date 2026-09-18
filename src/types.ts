export type WeaponType = "shoe" | "newspaper" | "swatter";

export interface WeaponInfo {
  id: WeaponType;
  name: string;
  subtitle: string;
  icon: string;
  radius: number; // Impact area in px
  cooldown: number; // ms
  speedRating: number; // 1-5
  powerRating: number; // 1-5
  accuracyBonus: number; // multiplier
  description: string;
  perk: string;
  soundType: "heavy" | "slap" | "twang";
  color: string;
}

export type DifficultyLevel = "easy" | "hard" | "expert";

export type BugSpecies = "ant" | "roach" | "fly" | "beetle" | "spider" | "golden" | "butterfly";

export interface Bug {
  id: string;
  species: BugSpecies;
  x: number; // percentage or px
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number; // degrees
  hp: number;
  maxHp: number;
  points: number;
  bornAt: number;
  isFlying?: boolean;
  scale: number;
  wigglePhase: number;
  isStunned?: boolean;
}

export interface StrikeEffect {
  id: string;
  x: number;
  y: number;
  weapon: WeaponType;
  text: string;
  subtext?: string;
  scoreBonus: number;
  isCrit: boolean;
  timestamp: number;
  color?: string;
}

export interface SplatDecal {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  weapon: WeaponType;
  timestamp: number;
}

export interface Particle {
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

export type GameMode = "arcade" | "speed" | "zen" | "multiplayer";

export interface GameStats {
  score: number;
  kills: number;
  totalSwings: number;
  directHits: number;
  combo: number;
  maxCombo: number;
  feverActive: boolean;
  accuracy: number;
  timeLeft: number;
  isGameOver: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  kills: number;
  accuracy: number;
  weapon: WeaponType;
  mode: string;
  timestamp: number;
  country?: string;
}

export interface UserProfile {
  syncKey: string;
  name: string;
  totalKills: number;
  highScore: number;
  selectedWeapon: WeaponType;
  unlockedBadges: string[];
  gamesPlayed: number;
  lastSyncedAt: number;
}

export type PlayModeChoice = "single" | "room";

export interface MultiplayerPlayer {
  id: string;
  name: string;
  weapon: WeaponType;
  score: number;
  kills: number;
  combo: number;
  lives: number;
  maxLives: number;
  status: "alive" | "out";
  eliminationRank?: number;
  eliminatedAt?: number;
  ready: boolean;
  isHost: boolean;
}

export interface MultiplayerRoom {
  roomId: string;
  status: "waiting" | "starting" | "playing" | "ended";
  timeLeft: number;
  roomWeapon?: WeaponType;
  difficulty?: DifficultyLevel;
  players: MultiplayerPlayer[];
  winnerId?: string;
  winnerName?: string;
  totalStartedPlayers?: number;
}

export interface EliminationNotification {
  id: string;
  playerId: string;
  playerName: string;
  rank: number;
  remainingAlive: number;
  timestamp: number;
}

export interface SpectatorReaction {
  id: string;
  fromName: string;
  targetPlayerId?: string;
  emoji: string;
  x?: number;
  y?: number;
  timestamp?: number;
}

export interface SyncedBugData {
  id: string;
  species: BugSpecies;
  normX: number;
  normY: number;
  targetNormX: number;
  targetNormY: number;
  speed: number;
  hp: number;
  maxHp: number;
  points: number;
  radius: number;
  bornAt: number;
  isFlying?: boolean;
}

export interface OpponentAction {
  id: string;
  playerId: string;
  playerName: string;
  weapon: WeaponType;
  x: number;
  y: number;
  normX?: number;
  normY?: number;
  bugId?: string;
  hit: boolean;
  killed: boolean;
  points: number;
  combo: number;
  score?: number;
  kills?: number;
  lives?: number;
  timestamp: number;
}

export interface OpenRoomSummary {
  id: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  roomWeapon: WeaponType;
  difficulty?: DifficultyLevel;
  createdAt: number;
}
