import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DifficultyLevel,
  EliminationNotification,
  GameStats,
  MultiplayerRoom,
  PlayModeChoice,
  StrikeEffect,
  UserProfile,
  WeaponType,
} from "./types";
import { MinimalHud } from "./components/MinimalHud";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { ShareModal } from "./components/ShareModal";
import { GameOverModal } from "./components/GameOverModal";
import { WeaponSelectScreen } from "./components/WeaponSelectScreen";
import { GameArenaCanvas } from "./components/GameArenaCanvas";
import { GameModeSelectScreen } from "./components/GameModeSelectScreen";
import { MultiplayerLobby } from "./components/MultiplayerLobby";
import { EliminationBanner } from "./components/EliminationBanner";
import { EliminatedPlayerScreen } from "./components/EliminatedPlayerScreen";
import { MultiplayerLeaderboardModal } from "./components/MultiplayerLeaderboardModal";
import {
  playComboChime,
  playNotificationPing,
  playPlayerEliminatedSound,
  playVictoryFanfare,
  setSoundEnabled,
} from "./utils/audio";

export default function App() {
  // Game Mode Selection: "single" | "room" | null (null shows mode selection screen)
  const [playMode, setPlayMode] = useState<PlayModeChoice | null>(null);

  // Weapon & Loadout
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>("shoe");
  const [showWeaponSelect, setShowWeaponSelect] = useState(false);

  // Audio State
  const [soundOn, setSoundOn] = useState(true);

  // Survival Lives Mechanic (3 misses = knocked out)
  const MAX_LIVES = 3;
  const [lives, setLives] = useState(MAX_LIVES);
  const [missAlert, setMissAlert] = useState(false);

  // Game Stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    totalSwings: 0,
    directHits: 0,
    combo: 0,
    maxCombo: 0,
    feverActive: false,
    accuracy: 100,
    timeLeft: 999,
    isGameOver: false,
  });

  // Top Combat Remarks Announcer
  const [latestStrike, setLatestStrike] = useState<StrikeEffect | null>(null);
  const strikeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Solo Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // Multiplayer Room State
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [showRoomLeaderboard, setShowRoomLeaderboard] = useState(false);
  const [eliminationNotification, setEliminationNotification] = useState<EliminationNotification | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const connectingPromiseRef = useRef<Promise<WebSocket> | null>(null);
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [urlJoinCode, setUrlJoinCode] = useState<string>("");

  // Difficulty Level (Solo and Multiplayer)
  const [soloDifficulty, setSoloDifficulty] = useState<DifficultyLevel>("easy");
  const [penaltyNotice, setPenaltyNotice] = useState<string | null>(null);
  const penaltyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showPenaltyNotice = (msg: string) => {
    if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);
    setPenaltyNotice(msg);
    penaltyTimerRef.current = setTimeout(() => {
      setPenaltyNotice(null);
    }, 2400);
  };

  const currentDifficulty: DifficultyLevel =
    playMode === "room" ? (activeRoom?.difficulty || "easy") : soloDifficulty;

  // Speed multiplier based on difficulty:
  // Easy: 1.0 (current game)
  // Hard: 1.75 (increased by 0.75x)
  // Expert: 2.5 (increased more than hard level)
  const speedMultiplier =
    currentDifficulty === "expert" ? 2.5 : currentDifficulty === "hard" ? 1.75 : 1.0;

  // Cross-device User Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("bugwhacker_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const randKey = "WHACK-" + Math.floor(1000 + Math.random() * 9000);
    return {
      syncKey: randKey,
      name: "Smasher",
      totalKills: 0,
      highScore: 0,
      selectedWeapon: "shoe",
      unlockedBadges: [],
      gamesPlayed: 0,
      lastSyncedAt: Date.now(),
    };
  });

  // Save profile locally
  useEffect(() => {
    localStorage.setItem("bugwhacker_profile", JSON.stringify(profile));
  }, [profile]);

  // Audio mute toggle
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Check URL params for direct room link (e.g. ?room=ABCD)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get("room");
    if (roomFromUrl) {
      const cleanCode = roomFromUrl.trim().toUpperCase();
      setUrlJoinCode(cleanCode);
      setPlayMode("room");
      setShowMultiplayerLobby(true);
    }
  }, []);

  // Reset round state
  const startRound = useCallback(() => {
    setStats({
      score: 0,
      kills: 0,
      totalSwings: 0,
      directHits: 0,
      combo: 0,
      maxCombo: 0,
      feverActive: false,
      accuracy: 100,
      timeLeft: 999,
      isGameOver: false,
    });
    setLives(MAX_LIVES);
    setLatestStrike(null);
    setShowGameOver(false);
  }, []);

  // End of Solo Round handler
  const endSoloRound = useCallback(() => {
    playVictoryFanfare();
    setShowGameOver(true);

    setStats((prev) => {
      const finalStats = { ...prev, isGameOver: true };

      setProfile((oldProfile) => {
        const totalKills = oldProfile.totalKills + finalStats.kills;
        const highScore = Math.max(oldProfile.highScore, finalStats.score);
        const unlockedBadges = [...oldProfile.unlockedBadges];

        if (totalKills >= 1 && !unlockedBadges.includes("first_blood")) {
          unlockedBadges.push("first_blood");
        }
        if (totalKills >= 25 && !unlockedBadges.includes("slipper_slayer")) {
          unlockedBadges.push("slipper_slayer");
        }
        if (finalStats.accuracy >= 85 && !unlockedBadges.includes("paper_ninja")) {
          unlockedBadges.push("paper_ninja");
        }
        if (finalStats.maxCombo >= 8 && !unlockedBadges.includes("zap_king")) {
          unlockedBadges.push("zap_king");
        }
        if (totalKills >= 100 && !unlockedBadges.includes("hundred_club")) {
          unlockedBadges.push("hundred_club");
        }

        return {
          ...oldProfile,
          totalKills,
          highScore,
          gamesPlayed: oldProfile.gamesPlayed + 1,
          unlockedBadges,
        };
      });

      return finalStats;
    });
  }, []);

  // Connect or return pre-connected WebSocket and attach persistent listener
  const getSocket = useCallback((): Promise<WebSocket> => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setConnectionStatus("connected");
      return Promise.resolve(wsRef.current);
    }
    if (connectingPromiseRef.current) {
      return connectingPromiseRef.current;
    }

    setConnectionStatus("connecting");
    const promise = new Promise<WebSocket>((resolve, reject) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          try {
            ws.close();
          } catch {}
          connectingPromiseRef.current = null;
          setConnectionStatus("disconnected");
          reject(new Error("Connection timeout"));
        }
      }, 7000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        connectingPromiseRef.current = null;
        setConnectionStatus("connected");
        resolve(ws);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const { type } = data;

          if (type === "pong") {
            // Heartbeat received
            return;
          }

          if (type === "error") {
            console.warn("Multiplayer server error:", data.message);
            setMultiplayerError(data.message || "Multiplayer server error. Please try again.");
            return;
          }

          if (type === "room_created") {
            setMultiplayerError(null);
            setActiveRoom(data.room);
            setMyPlayerId(data.playerId);
            if (data.room?.roomWeapon) {
              setSelectedWeapon(data.room.roomWeapon);
            }
          } else if (type === "room_joined") {
            setMultiplayerError(null);
            setActiveRoom(data.room);
            setMyPlayerId(data.playerId);
            if (data.room?.roomWeapon) {
              setSelectedWeapon(data.room.roomWeapon);
            }
          } else if (type === "room_updated" || type === "player_joined" || type === "player_left") {
            setActiveRoom(data.room);
            if (data.room?.roomWeapon) {
              setSelectedWeapon(data.room.roomWeapon);
            }
          } else if (type === "match_started") {
            setActiveRoom(data.room);
            if (data.room?.roomWeapon) {
              setSelectedWeapon(data.room.roomWeapon);
            }
            setShowMultiplayerLobby(false);
            setShowRoomLeaderboard(false);
            startRound();
          } else if (type === "room_scores_updated") {
            setActiveRoom(data.room);
          } else if (type === "player_eliminated") {
            setActiveRoom(data.room);
            playPlayerEliminatedSound();

            setEliminationNotification({
              id: Math.random().toString(),
              playerId: data.eliminatedPlayerId,
              playerName: data.playerName,
              rank: data.rank,
              remainingAlive: data.remainingAlive,
              timestamp: Date.now(),
            });

            setTimeout(() => {
              setEliminationNotification((current) =>
                current?.playerId === data.eliminatedPlayerId ? null : current
              );
            }, 3200);

            if (data.eliminatedPlayerId === myPlayerId) {
              setLives(0);
            }
          } else if (type === "player_life_updated") {
            setActiveRoom(data.room);
          } else if (type === "match_ended") {
            setActiveRoom(data.room);
            setShowRoomLeaderboard(true);
            playVictoryFanfare();
          } else if (type === "lobby_restarted") {
            setActiveRoom(data.room);
            if (data.room?.roomWeapon) {
              setSelectedWeapon(data.room.roomWeapon);
            }
            setShowRoomLeaderboard(false);
            setShowMultiplayerLobby(true);
            playNotificationPing();
          }
        } catch (err) {
          console.error("WS message parse error:", err);
        }
      };

      ws.onerror = (err) => {
        clearTimeout(connectionTimeout);
        connectingPromiseRef.current = null;
        setConnectionStatus("disconnected");
        console.warn("Multiplayer WS error:", err);
        reject(err);
      };

      ws.onclose = () => {
        clearTimeout(connectionTimeout);
        connectingPromiseRef.current = null;
        setConnectionStatus("disconnected");
        wsRef.current = null;
      };
    });

    connectingPromiseRef.current = promise;
    return promise;
  }, [myPlayerId, startRound]);

  // Pre-connect WebSocket as soon as App mounts so room creation is instant!
  useEffect(() => {
    getSocket().catch(() => {});
  }, [getSocket]);

  // Heartbeat ping every 10 seconds to keep connection alive through cloud proxies
  useEffect(() => {
    const pingTimer = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "ping" }));
        } catch {}
      }
    }, 10000);
    return () => clearInterval(pingTimer);
  }, []);

  // Back to Menu / Switch Mode Option
  const handleBackToMenu = useCallback(() => {
    setShowGameOver(false);
    setShowWeaponSelect(false);
    setShowLeaderboard(false);
    setShowShare(false);
    setShowMultiplayerLobby(false);
    setShowRoomLeaderboard(false);
    setActiveRoom(null);
    setMyPlayerId(null);
    setPlayMode(null);
  }, []);

  // Mode Selection handler
  const handleSelectMode = (mode: PlayModeChoice) => {
    setPlayMode(mode);
    if (mode === "single") {
      setShowMultiplayerLobby(false);
      setShowWeaponSelect(true);
    } else {
      setShowMultiplayerLobby(true);
    }
  };

  // Weapon selected
  const handleWeaponConfirmed = (weaponChoice: WeaponType, difficultyChoice: DifficultyLevel = "easy") => {
    setSelectedWeapon(weaponChoice);
    setSoloDifficulty(difficultyChoice);
    setProfile((prev) => ({ ...prev, selectedWeapon: weaponChoice }));
    setShowWeaponSelect(false);

    // If in multiplayer room, inform server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoom) {
      wsRef.current.send(
        JSON.stringify({
          type: "update_weapon",
          weapon: weaponChoice,
        })
      );
    }

    if (playMode === "single") {
      startRound();
    }
  };

  // Handle successful hit
  const handleCanvasHit = (hitInfo: {
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
  }) => {
    // Show top combat announcer text
    const strike: StrikeEffect = {
      id: Math.random().toString(),
      x: hitInfo.strikeX,
      y: hitInfo.strikeY,
      weapon: selectedWeapon,
      text: hitInfo.text,
      subtext: hitInfo.subtext,
      scoreBonus: hitInfo.points,
      isCrit: hitInfo.isCrit,
      timestamp: Date.now(),
    };

    setLatestStrike(strike);
    if (strikeTimerRef.current) clearTimeout(strikeTimerRef.current);
    strikeTimerRef.current = setTimeout(() => {
      setLatestStrike(null);
    }, 1400);

    // Update local stats
    const newKills = stats.kills + (hitInfo.killedAny ? hitInfo.hitCount : 0);
    const newScore = stats.score + hitInfo.points;
    const newTotalSwings = stats.totalSwings + 1;
    const newDirectHits = stats.directHits + 1;
    const newAccuracy = Math.round((newDirectHits / newTotalSwings) * 100);
    const newCombo = stats.combo + 1;
    playComboChime(newCombo);

    setStats((prev) => ({
      ...prev,
      score: newScore,
      kills: newKills,
      totalSwings: newTotalSwings,
      directHits: newDirectHits,
      combo: newCombo,
      maxCombo: Math.max(prev.maxCombo, newCombo),
      accuracy: newAccuracy,
      feverActive: newCombo >= 6,
    }));

    // Update score in room multiplayer so all players receive live score sync
    if (playMode === "room" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoom) {
      wsRef.current.send(
        JSON.stringify({
          type: "update_score",
          points: hitInfo.points,
          kills: hitInfo.killedAny ? hitInfo.hitCount : 0,
          combo: newCombo,
        })
      );
    }
  };

  // Central life loss deduction logic
  const deductLife = (reason: "miss" | "butterfly" | "escaped") => {
    if (stats.isGameOver || showWeaponSelect || playMode === null) return;

    setMissAlert(true);
    setTimeout(() => setMissAlert(false), 350);

    if (reason === "butterfly") {
      showPenaltyNotice("⚠️ BUTTERFLY KILLED! -1 LIFE");
    } else if (reason === "escaped") {
      showPenaltyNotice("⚠️ BUG ESCAPED! -1 LIFE");
    }

    setLives((prevLives) => {
      const nextLives = Math.max(0, prevLives - 1);

      if (playMode === "room") {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoom) {
          wsRef.current.send(
            JSON.stringify({
              type: "player_life_lost",
              lives: nextLives,
            })
          );
        }

        if (nextLives === 0) {
          playPlayerEliminatedSound();
        }
      } else {
        if (nextLives === 0) {
          setTimeout(() => {
            endSoloRound();
          }, 50);
        }
      }

      return nextLives;
    });
  };

  // Handle missed swing
  const handleMiss = () => {
    if (stats.isGameOver || showWeaponSelect || playMode === null) return;

    deductLife("miss");

    setStats((prev) => {
      const newTotalSwings = prev.totalSwings + 1;
      const newAccuracy = Math.round((prev.directHits / newTotalSwings) * 100);
      return {
        ...prev,
        totalSwings: newTotalSwings,
        combo: 0,
        accuracy: newAccuracy,
        feverActive: false,
      };
    });
  };

  // Handle butterfly struck (not allowed to kill, -1 life)
  const handleButterflyHarm = () => {
    deductLife("butterfly");
  };

  // Handle bug escape (in expert mode: none of the bugs should escape kill all, -1 life)
  const handleBugEscaped = () => {
    if (currentDifficulty === "expert") {
      deductLife("escaped");
    }
  };

  // Room rematch (Host restarts lobby for all players in room)
  const handleRoomRematch = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: "restart_lobby",
      })
    );
  };

  // Exit room to mode select
  const handleExitRoomToMenu = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setActiveRoom(null);
    setMyPlayerId(null);
    setShowRoomLeaderboard(false);
    setShowMultiplayerLobby(false);
    setPlayMode(null);
  };

  // Room Player Status Checks
  const myRoomPlayer = activeRoom?.players.find((p) => p.id === myPlayerId);
  const isMyPlayerEliminated =
    playMode === "room" && (lives <= 0 || myRoomPlayer?.status === "out");
  const myEliminationRank = myRoomPlayer?.eliminationRank;
  const isHost = myRoomPlayer?.isHost ?? false;
  const alivePlayers = activeRoom?.players.filter((p) => p.status === "alive") || [];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 select-none">
      {/* 1. SEAMLESS HARDWARE-ACCELERATED ARENA CANVAS */}
      <main id="bug-smash-arena" className="absolute inset-0 w-full h-full touch-none">
        <GameArenaCanvas
          weapon={selectedWeapon}
          isPlaying={
            playMode !== null &&
            !stats.isGameOver &&
            !showWeaponSelect &&
            !showMultiplayerLobby &&
            !showRoomLeaderboard &&
            !isMyPlayerEliminated
          }
          speedMultiplier={speedMultiplier}
          difficulty={currentDifficulty}
          kills={stats.kills}
          onHit={handleCanvasHit}
          onMiss={handleMiss}
          onBugEscaped={handleBugEscaped}
          onButterflyHarm={handleButterflyHarm}
        />

        {/* Fever Mode Glow Border */}
        {stats.feverActive && !isMyPlayerEliminated && (
          <div className="absolute inset-0 pointer-events-none border-2 border-amber-400/60 shadow-[inset_0_0_24px_rgba(245,158,11,0.15)] animate-pulse" />
        )}

        {/* Miss Red Flash Border */}
        {missAlert && !isMyPlayerEliminated && (
          <div className="absolute inset-0 pointer-events-none border-4 border-rose-500/80 bg-rose-500/10 transition-opacity" />
        )}
      </main>

      {/* 2. REAL-TIME KNOCKOUT POPUP */}
      <EliminationBanner notification={eliminationNotification} />

      {/* 3. ELIMINATED PLAYER SCREEN (Live score is only for those who are eliminated when room has more than 2 players) */}
      {isMyPlayerEliminated && !showRoomLeaderboard && activeRoom && activeRoom.players.length > 2 && (
        <EliminatedPlayerScreen
          room={activeRoom}
          myPlayerId={myPlayerId}
          myEliminationRank={myEliminationRank}
          onExitToMenu={handleExitRoomToMenu}
        />
      )}

      {/* 4. MINIMALIST FLOATING TOP HUD (Clean gameplay screen without live score) */}
      {playMode !== null && !showWeaponSelect && !showMultiplayerLobby && !showRoomLeaderboard && !isMyPlayerEliminated && (
        <MinimalHud
          score={stats.score}
          kills={stats.kills}
          combo={stats.combo}
          lives={lives}
          maxLives={MAX_LIVES}
          speedMultiplier={speedMultiplier}
          difficulty={currentDifficulty}
          penaltyNotice={penaltyNotice}
          weapon={selectedWeapon}
          soundEnabled={soundOn}
          onToggleSound={toggleSound}
          onBackToMenu={handleBackToMenu}
          roomInfo={
            activeRoom
              ? {
                  roomId: activeRoom.roomId,
                  aliveCount: alivePlayers.length,
                  totalPlayers: activeRoom.players.length,
                }
              : null
          }
        />
      )}

      {/* 6. GAME MODE SELECTION SCREEN (Single Player vs. Room up to 12 players) */}
      {playMode === null && (
        <GameModeSelectScreen
          profile={profile}
          selectedWeapon={selectedWeapon}
          onUpdateName={(name) => setProfile((prev) => ({ ...prev, name }))}
          onChangeWeapon={() => setShowWeaponSelect(true)}
          onSelectMode={handleSelectMode}
        />
      )}

      {/* 7. MULTIPLAYER ROOM LOBBY (Create/Join with code, up to 12 players) */}
      <MultiplayerLobby
        isOpen={showMultiplayerLobby}
        onClose={() => {
          setShowMultiplayerLobby(false);
          if (!activeRoom) setPlayMode(null);
        }}
        selectedWeapon={selectedWeapon}
        onSelectWeapon={(w) => setSelectedWeapon(w)}
        playerName={profile.name}
        onStartMultiplayerMatch={() => {}}
        wsRef={wsRef}
        getSocket={getSocket}
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        myPlayerId={myPlayerId}
        setMyPlayerId={setMyPlayerId}
        defaultJoinCode={urlJoinCode}
        errorMessage={multiplayerError}
        onClearError={() => setMultiplayerError(null)}
        connectionStatus={connectionStatus}
      />

      {/* 8. WEAPON SELECTION & ANIMATION PREVIEW MODAL */}
      {showWeaponSelect && (
        <WeaponSelectScreen
          defaultWeapon={selectedWeapon}
          defaultDifficulty={soloDifficulty}
          highScore={profile.highScore}
          totalKills={profile.totalKills}
          onSelectAndStart={handleWeaponConfirmed}
          onBack={() => {
            setShowWeaponSelect(false);
            if (playMode === "single" && stats.score === 0 && !stats.isGameOver && stats.kills === 0) {
              setPlayMode(null);
            }
          }}
        />
      )}

      {/* 9. MULTIPLAYER END-GAME LEADERBOARD MODAL ("In the end a leaderboard should appear in which all the player should be standing as per there positions") */}
      <MultiplayerLeaderboardModal
        isOpen={showRoomLeaderboard}
        room={activeRoom}
        myPlayerId={myPlayerId}
        isHost={isHost}
        onRematch={handleRoomRematch}
        onExitToMenu={handleExitRoomToMenu}
        onClose={() => setShowRoomLeaderboard(false)}
      />

      {/* 10. SOLO GAME OVER MODAL */}
      <GameOverModal
        isOpen={showGameOver && playMode === "single"}
        stats={stats}
        weapon={selectedWeapon}
        topSpeed={speedMultiplier}
        onRestart={startRound}
        onChangeWeapon={() => {
          setShowGameOver(false);
          setShowWeaponSelect(true);
        }}
        onOpenShare={() => {
          setShowGameOver(false);
          setShowShare(true);
        }}
        onOpenLeaderboard={() => {
          setShowGameOver(false);
          setShowLeaderboard(true);
        }}
        onBackToMenu={handleBackToMenu}
      />

      {/* 11. GLOBAL LEADERBOARD MODAL */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentScore={stats.score}
        currentKills={stats.kills}
        currentAccuracy={stats.accuracy}
      />

      {/* 12. SHARE MODAL */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        stats={stats}
        weapon={selectedWeapon}
        playerName={profile.name}
      />
    </div>
  );
}
