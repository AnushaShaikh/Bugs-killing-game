import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  kills: number;
  accuracy: number;
  weapon: "shoe" | "newspaper" | "swatter";
  mode: "arcade" | "multiplayer" | "speed";
  timestamp: number;
  country?: string;
}

interface UserProfile {
  syncKey: string;
  name: string;
  totalKills: number;
  highScore: number;
  selectedWeapon: "shoe" | "newspaper" | "swatter";
  unlockedBadges: string[];
  gamesPlayed: number;
  lastSyncedAt: number;
}

// In-memory initial leaderboard seed
let leaderboard: LeaderboardEntry[] = [
  { id: "1", name: "GrandmaSquash", score: 18450, kills: 62, accuracy: 96, weapon: "shoe", mode: "arcade", timestamp: Date.now() - 3600000 * 2, country: "US" },
  { id: "2", name: "PaperNinja", score: 16200, kills: 58, accuracy: 92, weapon: "newspaper", mode: "arcade", timestamp: Date.now() - 3600000 * 5, country: "UK" },
  { id: "3", name: "ZapMaster99", score: 14890, kills: 55, accuracy: 89, weapon: "swatter", mode: "arcade", timestamp: Date.now() - 3600000 * 12, country: "JP" },
  { id: "4", name: "KitchenHero", score: 13100, kills: 49, accuracy: 88, weapon: "shoe", mode: "arcade", timestamp: Date.now() - 3600000 * 24, country: "DE" },
  { id: "5", name: "SlipperChamp", score: 11450, kills: 43, accuracy: 85, weapon: "shoe", mode: "arcade", timestamp: Date.now() - 3600000 * 36, country: "CA" },
];

const syncProfiles = new Map<string, UserProfile>();

interface RoomPlayer {
  id: string;
  ws: WebSocket;
  name: string;
  weapon: "shoe" | "newspaper" | "swatter";
  score: number;
  kills: number;
  combo: number;
  lives: number;
  maxLives: number;
  status: "alive" | "out";
  eliminationRank: number | null;
  eliminatedAt: number | null;
  ready: boolean;
  isHost: boolean;
}

interface Room {
  id: string;
  players: Map<string, RoomPlayer>;
  status: "waiting" | "starting" | "playing" | "ended";
  timeLeft: number;
  winnerId?: string;
  winnerName?: string;
  totalStartedPlayers?: number;
  roomWeapon: "shoe" | "newspaper" | "swatter";
  difficulty: "easy" | "hard" | "expert";
  roundTimer?: NodeJS.Timeout;
  emptyCleanupTimer?: NodeJS.Timeout;
  bugSpawnTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  // REST API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("/api/leaderboard", (_req, res) => {
    const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 50);
    res.json(sorted);
  });

  app.post("/api/leaderboard", (req, res) => {
    const { name, score, kills, accuracy, weapon, mode, country } = req.body;
    if (!name || typeof score !== "number") {
      return res.status(400).json({ error: "Invalid score submission" });
    }
    const entry: LeaderboardEntry = {
      id: Math.random().toString(36).substring(2, 9),
      name: String(name).slice(0, 16).trim() || "BugSmashHero",
      score: Math.max(0, Math.floor(score)),
      kills: Math.max(0, Math.floor(kills || 0)),
      accuracy: Math.min(100, Math.max(0, Math.floor(accuracy || 0))),
      weapon: ["shoe", "newspaper", "swatter"].includes(weapon) ? weapon : "shoe",
      mode: ["arcade", "multiplayer", "speed"].includes(mode) ? mode : "arcade",
      timestamp: Date.now(),
      country: country || "GLOBAL",
    };
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 200) {
      leaderboard = leaderboard.slice(0, 200);
    }
    const rank = leaderboard.findIndex((item) => item.id === entry.id) + 1;
    res.json({ success: true, entry, rank });
  });

  // Cross-device sync APIs
  app.get("/api/sync/:syncKey", (req, res) => {
    const { syncKey } = req.params;
    const profile = syncProfiles.get(syncKey.toUpperCase());
    if (!profile) {
      return res.status(404).json({ error: "Profile sync key not found" });
    }
    res.json(profile);
  });

  // Query active open rooms for 1-click joining
  app.get("/api/multiplayer/rooms", (_req, res) => {
    const openList = Array.from(rooms.values())
      .filter((r) => r.status === "waiting" && r.players.size < 12)
      .map((r) => {
        const host = Array.from(r.players.values()).find((p) => p.isHost);
        return {
          id: r.id,
          hostName: host?.name || "Host",
          playerCount: r.players.size,
          maxPlayers: 12,
          roomWeapon: r.roomWeapon || "shoe",
          difficulty: r.difficulty || "easy",
          createdAt: Date.now(),
        };
      });
    res.json(openList);
  });

  // Query specific room status via REST (fallback)
  app.get("/api/multiplayer/room/:roomId", (req, res) => {
    const rId = String(req.params.roomId || "").trim().toUpperCase();
    const room = rooms.get(rId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      weapon: p.weapon,
      score: p.score,
      kills: p.kills,
      combo: p.combo,
      lives: p.lives,
      maxLives: p.maxLives,
      status: p.status,
      eliminationRank: p.eliminationRank,
      ready: p.ready,
      isHost: p.isHost,
    }));
    res.json({
      roomId: room.id,
      status: room.status,
      timeLeft: room.timeLeft,
      roomWeapon: room.roomWeapon,
      players: playersList,
    });
  });

  app.post("/api/sync", (req, res) => {
    const { syncKey, name, totalKills, highScore, selectedWeapon, unlockedBadges, gamesPlayed } = req.body;
    const key = (syncKey ? String(syncKey) : Math.random().toString(36).substring(2, 8)).toUpperCase();
    const existing = syncProfiles.get(key) || {
      syncKey: key,
      name: "Player",
      totalKills: 0,
      highScore: 0,
      selectedWeapon: "shoe" as const,
      unlockedBadges: [],
      gamesPlayed: 0,
      lastSyncedAt: Date.now(),
    };

    const updated: UserProfile = {
      syncKey: key,
      name: name ? String(name).slice(0, 16) : existing.name,
      totalKills: Math.max(existing.totalKills, Number(totalKills) || 0),
      highScore: Math.max(existing.highScore, Number(highScore) || 0),
      selectedWeapon: ["shoe", "newspaper", "swatter"].includes(selectedWeapon) ? selectedWeapon : existing.selectedWeapon,
      unlockedBadges: Array.from(new Set([...(existing.unlockedBadges || []), ...(unlockedBadges || [])])),
      gamesPlayed: Math.max(existing.gamesPlayed, Number(gamesPlayed) || 0),
      lastSyncedAt: Date.now(),
    };

    syncProfiles.set(key, updated);
    res.json({ success: true, profile: updated });
  });

  // WebSocket Multiplayer Server
  wss.on("connection", (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let playerId: string | null = null;
    (ws as any).isAlive = true;

    ws.on("pong", () => {
      (ws as any).isAlive = true;
    });

    ws.on("error", (err) => {
      console.warn("WebSocket client error:", err.message);
    });

    const send = (type: string, payload: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...payload }));
      }
    };

    const broadcastToRoom = (roomId: string, type: string, payload: any, excludeWs?: WebSocket) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const message = JSON.stringify({ type, ...payload });
      room.players.forEach((p) => {
        if (p.ws.readyState === WebSocket.OPEN && p.ws !== excludeWs) {
          p.ws.send(message);
        }
      });
    };

    const startRoomBugSpawner = (room: Room) => {
      if (room.bugSpawnTimer) {
        clearInterval(room.bugSpawnTimer);
        room.bugSpawnTimer = undefined;
      }

      const interval = room.difficulty === "expert" ? 480 : room.difficulty === "hard" ? 720 : 920;

      room.bugSpawnTimer = setInterval(() => {
        if (room.status !== "playing" || room.players.size === 0) {
          if (room.bugSpawnTimer) clearInterval(room.bugSpawnTimer);
          room.bugSpawnTimer = undefined;
          return;
        }

        const edge = Math.floor(Math.random() * 4);
        let normX = 0, normY = 0, targetNormX = 0.5, targetNormY = 0.5;

        if (edge === 0) {
          normX = 0.1 + Math.random() * 0.8;
          normY = -0.06;
          targetNormX = 0.1 + Math.random() * 0.8;
          targetNormY = 0.65 + Math.random() * 0.25;
        } else if (edge === 1) {
          normX = 1.06;
          normY = 0.1 + Math.random() * 0.8;
          targetNormX = 0.15 + Math.random() * 0.5;
          targetNormY = 0.1 + Math.random() * 0.8;
        } else if (edge === 2) {
          normX = 0.1 + Math.random() * 0.8;
          normY = 1.06;
          targetNormX = 0.1 + Math.random() * 0.8;
          targetNormY = 0.15 + Math.random() * 0.5;
        } else {
          normX = -0.06;
          normY = 0.1 + Math.random() * 0.8;
          targetNormX = 0.35 + Math.random() * 0.5;
          targetNormY = 0.1 + Math.random() * 0.8;
        }

        const speciesList: ("roach" | "fly" | "spider" | "ant" | "beetle" | "golden")[] = ["roach", "roach", "fly", "fly", "spider", "ant"];
        if (Math.random() < 0.35) speciesList.push("beetle");
        if (Math.random() < 0.15) speciesList.push("golden");
        const isButterfly = (room.difficulty === "hard" || room.difficulty === "expert") && Math.random() < 0.24;
        const species = isButterfly ? "butterfly" : speciesList[Math.floor(Math.random() * speciesList.length)];

        let speed = 140;
        let points = 180;
        let hp = 1;
        let radius = 28;
        if (species === "butterfly") { speed = 90; points = 0; radius = 30; }
        else if (species === "roach") { speed = 160; points = 180; radius = 28; }
        else if (species === "fly") { speed = 145; points = 220; radius = 24; }
        else if (species === "beetle") { speed = 75; points = 350; hp = 2; radius = 34; }
        else if (species === "spider") { speed = 115; points = 260; radius = 30; }
        else if (species === "golden") { speed = 210; points = 850; radius = 32; }
        else if (species === "ant") { speed = 125; points = 150; radius = 22; }

        const bugData = {
          id: "b_" + Math.random().toString(36).substring(2, 9),
          species,
          normX,
          normY,
          targetNormX,
          targetNormY,
          speed,
          hp,
          maxHp: hp,
          points,
          radius,
          bornAt: Date.now(),
          isFlying: species === "fly" || species === "butterfly",
        };

        broadcastToRoom(room.id, "bug_spawned", { bug: bugData });
      }, interval);
    };

    const stopRoomBugSpawner = (room: Room) => {
      if (room.bugSpawnTimer) {
        clearInterval(room.bugSpawnTimer);
        room.bugSpawnTimer = undefined;
      }
    };

    const getRoomSummary = (room: Room) => {
      // Sort players for leaderboard:
      // Active players with rank 1 first, then order by eliminationRank ascending (1, 2, 3...), then score desc
      const playersList = Array.from(room.players.values())
        .map((p) => ({
          id: p.id,
          name: p.name,
          weapon: p.weapon,
          score: p.score,
          kills: p.kills,
          combo: p.combo,
          lives: p.lives,
          maxLives: p.maxLives,
          status: p.status,
          eliminationRank: p.eliminationRank ?? (p.status === "alive" ? 1 : room.players.size),
          eliminatedAt: p.eliminatedAt ?? null,
          ready: p.ready,
          isHost: p.isHost,
        }))
        .sort((a, b) => {
          if (room.status === "ended") {
            const rankA = a.eliminationRank ?? 999;
            const rankB = b.eliminationRank ?? 999;
            if (rankA !== rankB) return rankA - rankB;
            return b.score - a.score;
          }
          if (a.status !== b.status) {
            return a.status === "alive" ? -1 : 1;
          }
          return b.score - a.score;
        });

      return {
        roomId: room.id,
        status: room.status,
        timeLeft: room.timeLeft,
        roomWeapon: room.roomWeapon || "shoe",
        difficulty: room.difficulty || "easy",
        winnerId: room.winnerId,
        winnerName: room.winnerName,
        totalStartedPlayers: room.totalStartedPlayers ?? room.players.size,
        players: playersList,
      };
    };

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type } = data;

        if (type === "ping") {
          send("pong", { timestamp: Date.now() });
          return;
        }

        if (type === "create_room") {
          const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
          const pId = Math.random().toString(36).substring(2, 9);
          playerId = pId;
          currentRoomId = roomId;

          const chosenWeapon = ["shoe", "newspaper", "swatter"].includes(data.weapon) ? data.weapon : "shoe";
          const chosenDifficulty = ["easy", "hard", "expert"].includes(data.difficulty) ? data.difficulty : "easy";

          const player: RoomPlayer = {
            id: pId,
            ws,
            name: data.name ? String(data.name).slice(0, 14) : "Player 1",
            weapon: chosenWeapon,
            score: 0,
            kills: 0,
            combo: 0,
            lives: 3,
            maxLives: 3,
            status: "alive",
            eliminationRank: null,
            eliminatedAt: null,
            ready: true,
            isHost: true,
          };

          const newRoom: Room = {
            id: roomId,
            players: new Map([[pId, player]]),
            status: "waiting",
            timeLeft: 999,
            roomWeapon: chosenWeapon,
            difficulty: chosenDifficulty,
          };
          rooms.set(roomId, newRoom);

          send("room_created", {
            roomId,
            playerId: pId,
            room: getRoomSummary(newRoom),
          });
        } else if (type === "join_room") {
          const targetRoomId = String(data.roomId || "").replace(/\s+/g, "").toUpperCase();
          const room = rooms.get(targetRoomId);

          if (!room) {
            return send("error", {
              code: "ROOM_NOT_FOUND",
              message: `Room "${targetRoomId}" was not found. Please verify the code or pick an active room from the list!`,
            });
          }
          if (room.players.size >= 12) {
            return send("error", {
              code: "ROOM_FULL",
              message: `Room "${targetRoomId}" is currently full (12/12 players).`,
            });
          }

          // Cancel any pending empty-room purge timer
          if (room.emptyCleanupTimer) {
            clearTimeout(room.emptyCleanupTimer);
            room.emptyCleanupTimer = undefined;
          }

          const pId = Math.random().toString(36).substring(2, 9);
          playerId = pId;
          currentRoomId = targetRoomId;

          // All players in the room inherit the host's selected weapon!
          const hostWeapon = room.roomWeapon || "shoe";

          // If match is already in progress, join as spectator
          const isOngoing = room.status === "playing";
          const needsHost = room.players.size === 0 || !Array.from(room.players.values()).some((p) => p.isHost);

          const player: RoomPlayer = {
            id: pId,
            ws,
            name: data.name ? String(data.name).slice(0, 14) : `Player ${room.players.size + 1}`,
            weapon: hostWeapon,
            score: 0,
            kills: 0,
            combo: 0,
            lives: isOngoing ? 0 : 3,
            maxLives: 3,
            status: isOngoing ? "out" : "alive",
            eliminationRank: isOngoing ? room.players.size + 1 : null,
            eliminatedAt: isOngoing ? Date.now() : null,
            ready: true,
            isHost: needsHost,
          };

          room.players.set(pId, player);
          send("room_joined", {
            roomId: targetRoomId,
            playerId: pId,
            room: getRoomSummary(room),
            joinedAsSpectator: isOngoing,
          });

          broadcastToRoom(targetRoomId, "player_joined", {
            room: getRoomSummary(room),
            newPlayer: { id: pId, name: player.name },
          });
        } else if (type === "update_weapon") {
          if (!currentRoomId || !playerId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const player = room.players.get(playerId);
          
          // The host always selects the weapon and ALL players in the room use it!
          if (player && player.isHost && data.weapon) {
            const validWeapon = ["shoe", "newspaper", "swatter"].includes(data.weapon) ? data.weapon : "shoe";
            room.roomWeapon = validWeapon;
            room.players.forEach((p) => {
              p.weapon = validWeapon;
            });
            broadcastToRoom(currentRoomId, "room_updated", {
              room: getRoomSummary(room),
            });
          }
        } else if (type === "update_difficulty") {
          if (!currentRoomId || !playerId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const player = room.players.get(playerId);

          // The host decides the level!
          if (player && player.isHost && data.difficulty) {
            const validDiff = ["easy", "hard", "expert"].includes(data.difficulty) ? data.difficulty : "easy";
            room.difficulty = validDiff;
            broadcastToRoom(currentRoomId, "room_updated", {
              room: getRoomSummary(room),
            });
          }
        } else if (type === "start_match") {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          room.status = "playing";
          room.winnerId = undefined;
          room.winnerName = undefined;
          room.totalStartedPlayers = room.players.size;

          const hostWeapon = room.roomWeapon || "shoe";
          room.players.forEach((p) => {
            p.weapon = hostWeapon;
            p.score = 0;
            p.kills = 0;
            p.combo = 0;
            p.lives = 3;
            p.maxLives = 3;
            p.status = "alive";
            p.eliminationRank = null;
            p.eliminatedAt = null;
          });

          // Start server-authoritative bug spawner for synchronous arena combat!
          startRoomBugSpawner(room);

          broadcastToRoom(currentRoomId, "match_started", {
            room: getRoomSummary(room),
          });
        } else if (type === "player_life_lost") {
          if (!currentRoomId || !playerId) return;
          const room = rooms.get(currentRoomId);
          if (!room || room.status !== "playing") return;

          const player = room.players.get(playerId);
          if (!player || player.status !== "alive") return;

          const currentLives = typeof data.lives === "number" ? Math.max(0, data.lives) : Math.max(0, player.lives - 1);
          player.lives = currentLives;

          // Check for elimination
          if (player.lives <= 0) {
            player.status = "out";

            // Count surviving players before this elimination
            const alivePlayers = Array.from(room.players.values()).filter((p) => p.status === "alive");
            // The eliminated player gets rank = aliveCount + 1
            const elimRank = alivePlayers.length + 1;
            player.eliminationRank = elimRank;
            player.eliminatedAt = Date.now();

            const remainingAlive = alivePlayers.length;

            // Broadcast immediate elimination notification to everyone in room!
            broadcastToRoom(currentRoomId, "player_eliminated", {
              eliminatedPlayerId: player.id,
              playerName: player.name,
              rank: elimRank,
              remainingAlive,
              room: getRoomSummary(room),
            });

            // If only 1 survivor remains (or 0 if solo room), end the match and crown winner!
            if (alivePlayers.length <= 1 && room.players.size > 1) {
              const survivor = alivePlayers[0];
              if (survivor) {
                survivor.eliminationRank = 1;
                room.winnerId = survivor.id;
                room.winnerName = survivor.name;
              }
              room.status = "ended";
              stopRoomBugSpawner(room);

              setTimeout(() => {
                broadcastToRoom(currentRoomId, "match_ended", {
                  room: getRoomSummary(room),
                  winner: survivor ? { id: survivor.id, name: survivor.name } : null,
                });
              }, 400);
            } else if (room.players.size === 1 && remainingAlive === 0) {
              // Solo practice room died
              room.status = "ended";
              stopRoomBugSpawner(room);
              broadcastToRoom(currentRoomId, "match_ended", {
                room: getRoomSummary(room),
                winner: null,
              });
            }
          } else {
            // Life lost but still alive, broadcast update
            broadcastToRoom(currentRoomId, "player_life_updated", {
              playerId: player.id,
              lives: player.lives,
              room: getRoomSummary(room),
            });
          }
        } else if (type === "smash_action") {
          if (!currentRoomId || !playerId) return;
          const room = rooms.get(currentRoomId);
          if (!room || room.status !== "playing") return;

          const player = room.players.get(playerId);
          if (player && player.status === "alive") {
            player.score += data.points || 0;
            player.kills += data.killed ? 1 : 0;
            player.combo = data.combo || 0;
            if (data.weapon) player.weapon = data.weapon;
          }

          // Broadcast the strike action to other players & spectators
          broadcastToRoom(currentRoomId, "opponent_smash", {
            playerId,
            playerName: player?.name || "Rival",
            weapon: player?.weapon || "shoe",
            bugId: data.bugId,
            normX: typeof data.normX === "number" ? data.normX : (typeof data.x === "number" ? data.x : 0.5),
            normY: typeof data.normY === "number" ? data.normY : (typeof data.y === "number" ? data.y : 0.5),
            hit: data.hit,
            killed: data.killed,
            points: data.points || 0,
            combo: player?.combo || 0,
            score: player?.score || 0,
            kills: player?.kills || 0,
            lives: player?.lives || 0,
          });
        } else if (type === "spectator_cheer") {
          if (!currentRoomId || !playerId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const sender = room.players.get(playerId);
          broadcastToRoom(currentRoomId, "spectator_reaction_received", {
            id: Math.random().toString(),
            fromName: sender?.name || "Spectator",
            targetPlayerId: data.targetPlayerId,
            emoji: data.emoji || "👏",
            x: data.x,
            y: data.y,
          });
        } else if (type === "restart_lobby") {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          room.status = "waiting";
          room.winnerId = undefined;
          room.winnerName = undefined;
          stopRoomBugSpawner(room);
          const hostWeapon = room.roomWeapon || "shoe";
          room.players.forEach((p) => {
            p.weapon = hostWeapon;
            p.score = 0;
            p.kills = 0;
            p.combo = 0;
            p.lives = 3;
            p.maxLives = 3;
            p.status = "alive";
            p.eliminationRank = null;
            p.eliminatedAt = null;
          });

          broadcastToRoom(currentRoomId, "lobby_restarted", {
            room: getRoomSummary(room),
          });
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const leavingPlayer = room.players.get(playerId);
          const wasAlive = leavingPlayer?.status === "alive";
          room.players.delete(playerId);

          if (room.players.size === 0) {
            stopRoomBugSpawner(room);
            if (room.roundTimer) clearInterval(room.roundTimer);
            // Provide a 5-minute grace period before cleaning up the empty room
            if (room.emptyCleanupTimer) clearTimeout(room.emptyCleanupTimer);
            const rId = currentRoomId;
            room.emptyCleanupTimer = setTimeout(() => {
              const checkRoom = rooms.get(rId);
              if (checkRoom && checkRoom.players.size === 0) {
                rooms.delete(rId);
                console.log(`Cleaned up empty room ${rId} after grace period`);
              }
            }, 300000); // 5 minutes grace period
          } else {
            // If the host left, assign new host to the first player
            const remainingPlayers = Array.from(room.players.values());
            if (remainingPlayers.length > 0 && !remainingPlayers.some((p) => p.isHost)) {
              remainingPlayers[0].isHost = true;
            }

            // If match is active and leaving player was alive, check remaining alive count
            if (room.status === "playing" && wasAlive) {
              const alivePlayers = remainingPlayers.filter((p) => p.status === "alive");
              if (alivePlayers.length <= 1 && remainingPlayers.length > 1) {
                const survivor = alivePlayers[0];
                if (survivor) {
                  survivor.eliminationRank = 1;
                  room.winnerId = survivor.id;
                  room.winnerName = survivor.name;
                }
                room.status = "ended";
                stopRoomBugSpawner(room);
                broadcastToRoom(currentRoomId, "match_ended", {
                  room: getRoomSummary(room),
                  winner: survivor ? { id: survivor.id, name: survivor.name } : null,
                });
              }
            }

            broadcastToRoom(currentRoomId, "player_left", {
              playerId,
              playerName: leavingPlayer?.name || "Player",
              room: getRoomSummary(room),
            });
          }
        }
      }
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Periodic heartbeat interval to keep cloud reverse proxy connections alive
  const heartbeatTimer = setInterval(() => {
    wss.clients.forEach((clientWs) => {
      if ((clientWs as any).isAlive === false) {
        return clientWs.terminate();
      }
      (clientWs as any).isAlive = false;
      clientWs.ping();
    });
  }, 15000);

  wss.on("close", () => {
    clearInterval(heartbeatTimer);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server with WebSockets running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
