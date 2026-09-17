import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  EliminationNotification,
  GameStats,
  MultiplayerPlayer,
  MultiplayerRoom,
  PlayModeChoice,
  SpectatorReaction,
  StrikeEffect,
  UserProfile,
  WeaponType,
} from "./types";
import { CombatAnnouncer } from "./components/CombatAnnouncer";
import { MinimalHud } from "./components/MinimalHud";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { ShareModal } from "./components/ShareModal";
import { GameOverModal } from "./components/GameOverModal";
import { WeaponSelectScreen } from "./components/WeaponSelectScreen";
import { GameArenaCanvas } from "./components/GameArenaCanvas";
import { GameModeSelectScreen } from "./components/GameModeSelectScreen";
import { MultiplayerLobby } from "./components/MultiplayerLobby";
import { EliminationBanner } from "./components/EliminationBanner";
import { SpectatorOverlay } from "./components/SpectatorOverlay";
import { MultiplayerLeaderboardModal } from "./components/MultiplayerLeaderboardModal";
import {
  playCheerSound,
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
  const [isSpectating, setIsSpectating] = useState(false);
  const [spectatingTargetId, setSpectatingTargetId] = useState<string | null>(null);
  const [showRoomLeaderboard, setShowRoomLeaderboard] = useState(false);
  const [eliminationNotification, setEliminationNotification] = useState<EliminationNotification | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<SpectatorReaction[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Progressive Speed Multiplier: increases slowly as bugs are squashed
  const speedMultiplier = 1.0 + Math.min(stats.kills * 0.025, 2.8);

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
    setIsSpectating(false);
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

  // Setup WebSocket message listener when ws is connected
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        if (type === "room_created") {
          setActiveRoom(data.room);
          setMyPlayerId(data.playerId);
        } else if (type === "room_joined") {
          setActiveRoom(data.room);
          setMyPlayerId(data.playerId);
          if (data.joinedAsSpectator) {
            setIsSpectating(true);
            setShowMultiplayerLobby(false);
            startRound();
          }
        } else if (type === "room_updated" || type === "player_joined" || type === "player_left") {
          setActiveRoom(data.room);
        } else if (type === "match_started") {
          setActiveRoom(data.room);
          setShowMultiplayerLobby(false);
          setShowRoomLeaderboard(false);
          setIsSpectating(false);
          startRound();
        } else if (type === "player_eliminated") {
          setActiveRoom(data.room);
          playPlayerEliminatedSound();

          // Show floating knockout alert notification
          setEliminationNotification({
            id: Math.random().toString(),
            playerId: data.eliminatedPlayerId,
            playerName: data.playerName,
            rank: data.rank,
            remainingAlive: data.remainingAlive,
            timestamp: Date.now(),
          });

          // Auto-hide alert after 4.5 seconds
          setTimeout(() => {
            setEliminationNotification((current) =>
              current?.playerId === data.eliminatedPlayerId ? null : current
            );
          }, 4500);

          // If current local player was eliminated, switch into Spectator Mode!
          if (data.eliminatedPlayerId === myPlayerId) {
            setIsSpectating(true);
            const remaining = (data.room?.players as MultiplayerPlayer[])?.filter(
              (p) => p.status === "alive" && p.id !== myPlayerId
            );
            if (remaining && remaining.length > 0) {
              setSpectatingTargetId(remaining[0].id);
            }
          }
        } else if (type === "player_life_updated") {
          setActiveRoom(data.room);
        } else if (type === "spectator_reaction_received") {
          playCheerSound();
          const reaction: SpectatorReaction = {
            id: data.id || Math.random().toString(),
            fromName: data.fromName || "Spectator",
            emoji: data.emoji || "👏",
            x: 20 + Math.random() * 60,
            y: 80,
            timestamp: Date.now(),
          };
          setFloatingReactions((prev) => [...prev, reaction]);
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
          }, 2000);
        } else if (type === "match_ended") {
          setActiveRoom(data.room);
          setShowRoomLeaderboard(true);
          playVictoryFanfare();
        } else if (type === "lobby_restarted") {
          setActiveRoom(data.room);
          setShowRoomLeaderboard(false);
          setIsSpectating(false);
          setShowMultiplayerLobby(true);
          playNotificationPing();
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [myPlayerId, startRound]);

  // Mode Selection handler
  const handleSelectMode = (mode: PlayModeChoice) => {
    setPlayMode(mode);
    if (mode === "single") {
      setShowMultiplayerLobby(false);
      startRound();
    } else {
      setShowMultiplayerLobby(true);
    }
  };

  // Weapon selected
  const handleWeaponConfirmed = (weaponChoice: WeaponType) => {
    setSelectedWeapon(weaponChoice);
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
  }) => {
    // If spectating, strikes are disabled
    if (isSpectating) return;

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

    // Broadcast strike in room multiplayer
    if (playMode === "room" && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoom) {
      wsRef.current.send(
        JSON.stringify({
          type: "smash_action",
          x: hitInfo.strikeX,
          y: hitInfo.strikeY,
          hit: true,
          killed: hitInfo.killedAny,
          points: hitInfo.points,
          combo: newCombo,
          weapon: selectedWeapon,
        })
      );
    }
  };

  // Handle missed bug or bug escaped
  const handleMiss = () => {
    if (stats.isGameOver || showWeaponSelect || isSpectating || playMode === null) return;

    // Red flash alert
    setMissAlert(true);
    setTimeout(() => setMissAlert(false), 300);

    setLives((prevLives) => {
      const nextLives = Math.max(0, prevLives - 1);

      if (playMode === "room") {
        // Send life lost event to multiplayer room
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoom) {
          wsRef.current.send(
            JSON.stringify({
              type: "player_life_lost",
              lives: nextLives,
            })
          );
        }

        if (nextLives === 0) {
          // Player is knocked out in Room Battle Royale!
          setIsSpectating(true);
          playPlayerEliminatedSound();
        }
      } else {
        // Solo game over
        if (nextLives === 0) {
          setTimeout(() => {
            endSoloRound();
          }, 50);
        }
      }

      return nextLives;
    });

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

  // Spectator cheers
  const handleSendCheer = (emoji: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoom) return;
    wsRef.current.send(
      JSON.stringify({
        type: "spectator_cheer",
        emoji,
        targetPlayerId: spectatingTargetId,
        x: 20 + Math.random() * 60,
      })
    );
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
    setIsSpectating(false);
    setShowRoomLeaderboard(false);
    setShowMultiplayerLobby(false);
    setPlayMode(null);
  };

  // Current living players in the room for spectator overlay
  const alivePlayers = activeRoom?.players.filter((p) => p.status === "alive") || [];
  const myEliminationRank = activeRoom?.players.find((p) => p.id === myPlayerId)?.eliminationRank;
  const isHost = activeRoom?.players.find((p) => p.id === myPlayerId)?.isHost ?? false;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 1. SEAMLESS HARDWARE-ACCELERATED ARENA CANVAS */}
      <main id="bug-smash-arena" className="absolute inset-0 w-full h-full touch-none">
        <GameArenaCanvas
          weapon={selectedWeapon}
          isPlaying={playMode !== null && !stats.isGameOver && !showWeaponSelect && !showMultiplayerLobby && !showRoomLeaderboard}
          isSpectating={isSpectating}
          speedMultiplier={speedMultiplier}
          kills={stats.kills}
          onHit={handleCanvasHit}
          onMiss={handleMiss}
          onBugEscaped={handleMiss}
        />

        {/* Fever Mode Glow Border */}
        {stats.feverActive && !isSpectating && (
          <div className="absolute inset-0 pointer-events-none border-4 border-amber-500/80 animate-pulse" />
        )}

        {/* Miss Red Flash Border */}
        {missAlert && !isSpectating && (
          <div className="absolute inset-0 pointer-events-none border-8 border-red-600/90 bg-red-600/10 transition-opacity" />
        )}
      </main>

      {/* 2. REAL-TIME KNOCKOUT BANNER NOTIFICATION ("the player can get notified when any player outs ....") */}
      <EliminationBanner notification={eliminationNotification} />

      {/* 3. SPECTATOR MODE HUD ("the players who are already out can spectate the gameplay of the players remaining in the game") */}
      {isSpectating && (
        <SpectatorOverlay
          alivePlayers={alivePlayers}
          currentSpectatingId={spectatingTargetId}
          onSelectSpectatingId={(id) => setSpectatingTargetId(id)}
          onSendCheer={handleSendCheer}
          floatingReactions={floatingReactions}
          myEliminationRank={myEliminationRank}
        />
      )}

      {/* 4. COMPACT COMBAT REMARKS */}
      {!isSpectating && <CombatAnnouncer latestStrike={latestStrike} combo={stats.combo} />}

      {/* 5. MINIMALIST FLOATING TOP HUD */}
      {playMode !== null && !showWeaponSelect && !showMultiplayerLobby && !showRoomLeaderboard && !isSpectating && (
        <MinimalHud
          score={stats.score}
          kills={stats.kills}
          combo={stats.combo}
          lives={lives}
          maxLives={MAX_LIVES}
          speedMultiplier={speedMultiplier}
          weapon={selectedWeapon}
          soundEnabled={soundOn}
          onToggleSound={toggleSound}
          onChangeWeapon={() => setShowWeaponSelect(true)}
          roomInfo={
            activeRoom
              ? {
                  roomId: activeRoom.roomId,
                  aliveCount: alivePlayers.length,
                  totalPlayers: activeRoom.players.length,
                  isSpectating,
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
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        myPlayerId={myPlayerId}
        setMyPlayerId={setMyPlayerId}
      />

      {/* 8. WEAPON SELECTION & ANIMATION PREVIEW MODAL */}
      {showWeaponSelect && (
        <WeaponSelectScreen
          defaultWeapon={selectedWeapon}
          highScore={profile.highScore}
          totalKills={profile.totalKills}
          onSelectAndStart={handleWeaponConfirmed}
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
