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
  roundTimer?: NodeJS.Timeout;
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

        if (type === "create_room") {
          const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
          const pId = Math.random().toString(36).substring(2, 9);
          playerId = pId;
          currentRoomId = roomId;

          const player: RoomPlayer = {
            id: pId,
            ws,
            name: data.name ? String(data.name).slice(0, 14) : "Player 1",
            weapon: data.weapon || "shoe",
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
          };
          rooms.set(roomId, newRoom);

          send("room_created", {
            roomId,
            playerId: pId,
            room: getRoomSummary(newRoom),
          });
        } else if (type === "join_room") {
          const targetRoomId = String(data.roomId || "").trim().toUpperCase();
          const room = rooms.get(targetRoomId);

          if (!room) {
            return send("error", { message: `Room "${targetRoomId}" was not found. Check the code and try again!` });
          }
          if (room.players.size >= 12) {
            return send("error", { message: `Room ${targetRoomId} is full (maximum 12 players allowed)` });
          }

          const pId = Math.random().toString(36).substring(2, 9);
          playerId = pId;
          currentRoomId = targetRoomId;

          // If match is already in progress, join as spectator
          const isOngoing = room.status === "playing";

          const player: RoomPlayer = {
            id: pId,
            ws,
            name: data.name ? String(data.name).slice(0, 14) : `Player ${room.players.size + 1}`,
            weapon: data.weapon || "shoe",
            score: 0,
            kills: 0,
            combo: 0,
            lives: isOngoing ? 0 : 3,
            maxLives: 3,
            status: isOngoing ? "out" : "alive",
            eliminationRank: isOngoing ? room.players.size + 1 : null,
            eliminatedAt: isOngoing ? Date.now() : null,
            ready: true,
            isHost: false,
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
          if (player && data.weapon) {
            player.weapon = data.weapon;
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

          room.players.forEach((p) => {
            p.score = 0;
            p.kills = 0;
            p.combo = 0;
            p.lives = 3;
            p.maxLives = 3;
            p.status = "alive";
            p.eliminationRank = null;
            p.eliminatedAt = null;
          });

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

              setTimeout(() => {
                broadcastToRoom(currentRoomId, "match_ended", {
                  room: getRoomSummary(room),
                  winner: survivor ? { id: survivor.id, name: survivor.name } : null,
                });
              }, 400);
            } else if (room.players.size === 1 && remainingAlive === 0) {
              // Solo practice room died
              room.status = "ended";
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
            x: data.x,
            y: data.y,
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
          room.players.forEach((p) => {
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
            if (room.roundTimer) clearInterval(room.roundTimer);
            rooms.delete(currentRoomId);
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

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server with WebSockets running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
