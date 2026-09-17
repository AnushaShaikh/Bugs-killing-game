import React, { useState, useEffect, useRef } from "react";
import {
  DifficultyLevel,
  MultiplayerPlayer,
  MultiplayerRoom,
  WeaponType,
  OpenRoomSummary,
} from "../types";
import { WEAPONS } from "../data/weapons";
import {
  Users,
  Copy,
  Check,
  Play,
  ArrowRight,
  X,
  ArrowLeft,
  Crown,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Radio,
} from "lucide-react";
import {
  copyToClipboard,
  getPublicRoomLink,
  isDevSandbox,
  getSharedAppUrl,
  fetchOpenRooms,
} from "../utils/network";

interface MultiplayerLobbyProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeapon: WeaponType;
  onSelectWeapon: (weapon: WeaponType) => void;
  playerName: string;
  onStartMultiplayerMatch: (roomId: string, socket: WebSocket, isHost: boolean) => void;
  wsRef: React.MutableRefObject<WebSocket | null>;
  getSocket: () => Promise<WebSocket>;
  activeRoom: MultiplayerRoom | null;
  setActiveRoom: (room: MultiplayerRoom | null) => void;
  myPlayerId: string | null;
  setMyPlayerId: (id: string | null) => void;
  defaultJoinCode?: string;
  errorMessage?: string | null;
  onClearError?: () => void;
  connectionStatus?: "connecting" | "connected" | "disconnected";
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  isOpen,
  onClose,
  selectedWeapon,
  onSelectWeapon,
  playerName,
  wsRef,
  getSocket,
  activeRoom,
  setActiveRoom,
  myPlayerId,
  setMyPlayerId,
  defaultJoinCode = "",
  errorMessage,
  onClearError,
  connectionStatus = "connected",
}) => {
  const [joinCode, setJoinCode] = useState(defaultJoinCode);
  const [statusMsg, setStatusMsg] = useState("");
  const [copiedType, setCopiedType] = useState<"code" | "link" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [openRooms, setOpenRooms] = useState<OpenRoomSummary[]>([]);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);
  const isHost = useRef(false);

  // Pre-connect WebSocket as soon as lobby opens
  useEffect(() => {
    if (isOpen) {
      getSocket().catch(() => {});
    }
  }, [isOpen, getSocket]);

  // When room is created or joined, reset loading state
  useEffect(() => {
    if (activeRoom) {
      setIsConnecting(false);
      setStatusMsg("");
    }
  }, [activeRoom]);

  // If error is received from server, reset connecting state
  useEffect(() => {
    if (errorMessage) {
      setIsConnecting(false);
      setStatusMsg("");
    }
  }, [errorMessage]);

  // Sync weapon if host changes room weapon
  useEffect(() => {
    if (activeRoom?.roomWeapon && activeRoom.roomWeapon !== selectedWeapon) {
      onSelectWeapon(activeRoom.roomWeapon);
    }
  }, [activeRoom?.roomWeapon, onSelectWeapon, selectedWeapon]);

  // Check URL param ?room=CODE if any, and auto-join if provided
  const hasAutoJoinedRef = useRef(false);
  useEffect(() => {
    let code = defaultJoinCode;
    if (!code) {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("room");
      if (codeFromUrl) code = codeFromUrl;
    }

    if (code) {
      const cleanCode = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      setJoinCode(cleanCode);
      if (isOpen && !activeRoom && !hasAutoJoinedRef.current) {
        hasAutoJoinedRef.current = true;
        handleJoinRoomWithCode(cleanCode);
      }
    }
  }, [defaultJoinCode, isOpen, activeRoom]);

  // Poll open rooms while in the lobby selection screen
  const loadOpenRooms = async () => {
    setIsRefreshingRooms(true);
    const rooms = await fetchOpenRooms();
    setOpenRooms(rooms);
    setIsRefreshingRooms(false);
  };

  useEffect(() => {
    if (isOpen && !activeRoom) {
      loadOpenRooms();
      const interval = setInterval(loadOpenRooms, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeRoom]);

  const handleCreateRoom = async () => {
    if (onClearError) onClearError();
    setIsConnecting(true);
    setStatusMsg("Creating arena room...");
    try {
      const ws = await getSocket();
      isHost.current = true;

      ws.send(
        JSON.stringify({
          type: "create_room",
          name: playerName || "HostPlayer",
          weapon: selectedWeapon,
        })
      );
    } catch (e) {
      setStatusMsg("Failed to connect to multiplayer server. Please check your connection.");
      setIsConnecting(false);
    }
  };

  const handleJoinRoomWithCode = async (codeToJoin?: string) => {
    const raw = codeToJoin !== undefined ? codeToJoin : joinCode;
    const targetCode = String(raw || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!targetCode) {
      setStatusMsg("Please enter a valid room code.");
      return;
    }
    if (onClearError) onClearError();
    setIsConnecting(true);
    setStatusMsg(`Joining room ${targetCode}...`);
    try {
      const ws = await getSocket();
      isHost.current = false;

      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId: targetCode,
          name: playerName || "Challenger",
          weapon: selectedWeapon,
        })
      );
    } catch (e) {
      setStatusMsg("Failed to connect to multiplayer server.");
      setIsConnecting(false);
    }
  };

  const handleStartMatch = () => {
    if (!wsRef.current || !activeRoom) return;
    wsRef.current.send(
      JSON.stringify({
        type: "start_match",
      })
    );
  };

  const handleChangeLobbyWeapon = (w: WeaponType) => {
    onSelectWeapon(w);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoom) {
      wsRef.current.send(
        JSON.stringify({
          type: "update_weapon",
          weapon: w,
        })
      );
    }
  };

  const handleChangeDifficulty = (difficulty: DifficultyLevel) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeRoom) return;
    wsRef.current.send(
      JSON.stringify({
        type: "update_difficulty",
        roomId: activeRoom.roomId,
        difficulty,
      })
    );
  };

  const copyRoomCode = async () => {
    if (!activeRoom) return;
    const ok = await copyToClipboard(activeRoom.roomId);
    if (ok) {
      setCopiedType("code");
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const copyRoomLink = async () => {
    if (!activeRoom) return;
    const publicUrl = getPublicRoomLink(activeRoom.roomId);
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopiedType("link");
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleOpenInNewTab = () => {
    if (!activeRoom) return;
    const publicUrl = getPublicRoomLink(activeRoom.roomId);
    window.open(publicUrl, "_blank", "noopener,noreferrer");
  };

  const isCurrentPlayerHost = activeRoom?.players.find((p) => p.id === myPlayerId)?.isHost ?? false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl shadow-indigo-950/60 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Back to game mode selection"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                <span>Multiplayer Room Arena</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-indigo-100">
                  Up to 12 Players
                </span>
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                {activeRoom ? `Room Code: ${activeRoom.roomId}` : "Play together with friends on any phone or PC"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                connectionStatus === "connected"
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                  : connectionStatus === "connecting"
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-200 animate-pulse"
                  : "bg-red-500/20 border-red-400/40 text-red-200"
              }`}
            >
              {connectionStatus === "connected" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Online</span>
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-300" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-red-300" />
                  <span>Offline</span>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Server Error Alert Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-950/70 border-2 border-red-500/60 rounded-2xl flex flex-col gap-2.5 text-red-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black text-white">Connection Notice</div>
                    <div className="text-xs text-red-200/90 mt-0.5">{errorMessage}</div>
                  </div>
                </div>
                {onClearError && (
                  <button
                    onClick={onClearError}
                    className="p-1 rounded-lg hover:bg-red-800/50 text-red-300 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-red-800/50">
                <button
                  type="button"
                  onClick={() => {
                    if (onClearError) onClearError();
                    handleCreateRoom();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Host Your Own Room Instead</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearError) onClearError();
                    loadOpenRooms();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Check Active Rooms</span>
                </button>
              </div>
            </div>
          )}

          {!activeRoom ? (
            /* Option A: Create or Join a Room */
            <div className="space-y-4">
              <div className="text-center py-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl mx-auto mb-2">
                  ⚔️
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Join or Create a Battle Room
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                  Play with friends across any phone, tablet, or browser. Host selects the weapon for all participants!
                </p>
              </div>

              {/* Action 1: Create Room */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                    Option 1: Host a Game
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Host selects match weapon
                  </span>
                </div>

                {/* Pre-select Weapon for the Room */}
                <div className="p-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold text-[11px]">Match Weapon:</span>
                    <span className="text-amber-300 font-black text-xs">{WEAPONS[selectedWeapon]?.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["shoe", "newspaper", "swatter"] as WeaponType[]).map((wKey) => {
                      const w = WEAPONS[wKey];
                      const isSelected = selectedWeapon === wKey;
                      return (
                        <button
                          key={wKey}
                          type="button"
                          onClick={() => onSelectWeapon(wKey)}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/25 border-amber-400 text-white shadow-sm ring-1 ring-amber-400"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="text-lg">{w.icon}</span>
                          <div className="text-left truncate">
                            <div className="text-xs font-black truncate">{w.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleCreateRoom}
                  id="create-room-button"
                  disabled={isConnecting}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Users className="w-4 h-4" />
                  <span>{isConnecting ? "Creating Arena Room..." : "Create Room for Friends (Up to 12)"}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  OR ENTER CODE
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Action 2: Join Room with Code */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2.5">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  Option 2: Enter Room Code
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="ENTER 5-LETTER CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoomWithCode()}
                    className="flex-1 px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-center font-black tracking-widest text-base text-white uppercase placeholder:tracking-normal placeholder:font-bold placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    onClick={() => handleJoinRoomWithCode()}
                    id="join-room-button"
                    disabled={isConnecting || !joinCode.trim()}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <span>Join Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action 3: Live Active Rooms in Waiting State */}
              {openRooms.length > 0 && (
                <div className="p-3.5 bg-slate-900/90 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-400 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                      Active Waiting Rooms ({openRooms.length})
                    </span>
                    <button
                      onClick={loadOpenRooms}
                      disabled={isRefreshingRooms}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshingRooms ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {openRooms.map((room) => {
                      const weaponInfo = WEAPONS[room.roomWeapon] || WEAPONS.shoe;
                      return (
                        <div
                          key={room.id}
                          className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between hover:border-indigo-500 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{weaponInfo.icon}</span>
                            <div>
                              <div className="text-xs font-black text-white flex items-center gap-1.5">
                                <span className="tracking-wider font-mono text-indigo-300">{room.id}</span>
                                <span className="text-slate-400 font-normal">by {room.hostName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{room.playerCount} / {room.maxPlayers} players</span>
                                <span>•</span>
                                <span>{weaponInfo.name}</span>
                                <span>•</span>
                                <span className="font-bold text-amber-300 capitalize">{room.difficulty || "easy"}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleJoinRoomWithCode(room.id)}
                            disabled={isConnecting}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <span>Join</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {statusMsg && (
                <p className="text-center text-xs font-bold text-amber-400 animate-pulse">
                  {statusMsg}
                </p>
              )}
            </div>
          ) : (
            /* Option B: Inside an Active Room Lobby (Waiting for match start) */
            <div className="space-y-4">
              {/* Room Code & Invite Share Card */}
              <div className="p-4 bg-indigo-950/50 border-2 border-indigo-500/50 rounded-2xl text-center relative">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  Room Invite Code
                </span>
                <div className="text-3xl font-black tracking-widest text-white mt-0.5 font-mono">
                  {activeRoom.roomId}
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={copyRoomCode}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {copiedType === "code" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedType === "code" ? "Code Copied!" : "Copy Code Only"}</span>
                  </button>

                  <button
                    onClick={copyRoomLink}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {copiedType === "link" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedType === "link" ? "Link Copied!" : "Copy Public Invite Link"}</span>
                  </button>

                  <button
                    onClick={handleOpenInNewTab}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Open this room in a new browser tab to battle"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </button>
                </div>

                <p className="text-[10px] text-indigo-200/80 mt-2 bg-indigo-900/40 p-1.5 rounded-lg border border-indigo-700/40">
                  💡 <strong>Multiplayer Tip:</strong> Click <strong>"Open in New Tab"</strong> to immediately join this arena from a second player window! Both players stay connected to the same live game server.
                </p>
              </div>

              {/* Room Weapon Section: Host controls it, all players use it! */}
              {isCurrentPlayerHost ? (
                <div className="p-3.5 bg-slate-800/90 border-2 border-amber-500/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-[11px] uppercase font-black text-amber-300 tracking-wider">
                        Host Weapon Controls
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-200/90 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Equipped by all players
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["shoe", "newspaper", "swatter"] as WeaponType[]).map((wKey) => {
                      const w = WEAPONS[wKey];
                      const isSelected = (activeRoom.roomWeapon || selectedWeapon) === wKey;
                      return (
                        <button
                          key={wKey}
                          type="button"
                          onClick={() => handleChangeLobbyWeapon(wKey)}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/25 border-amber-400 text-white shadow-sm ring-1 ring-amber-400"
                              : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="text-xl">{w.icon}</span>
                          <div className="text-left truncate">
                            <div className="text-xs font-black truncate">{w.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{WEAPONS[activeRoom.roomWeapon || "shoe"]?.icon}</span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Match Weapon (Set by Host)
                      </span>
                      <span className="text-xs font-black text-white">
                        {WEAPONS[activeRoom.roomWeapon || "shoe"]?.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                    Host Decides
                  </span>
                </div>
              )}

              {/* Room Difficulty Section: Host controls it ("the host decides the level") */}
              {isCurrentPlayerHost ? (
                <div className="p-3.5 bg-slate-800/90 border-2 border-indigo-500/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-[11px] uppercase font-black text-indigo-300 tracking-wider">
                        Room Difficulty (Host Decides)
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-200/90 font-bold bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Applied to all players
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* EASY */}
                    <button
                      type="button"
                      id="lobby-difficulty-easy"
                      onClick={() => handleChangeDifficulty("easy")}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        (activeRoom.difficulty || "easy") === "easy"
                          ? "bg-emerald-500/25 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                          <span>🟢</span> Easy
                        </span>
                        {(activeRoom.difficulty || "easy") === "easy" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-300 font-semibold mt-0.5">1.0x Speed</div>
                      <div className="text-[9px] text-slate-400">Current game rules</div>
                    </button>

                    {/* HARD */}
                    <button
                      type="button"
                      id="lobby-difficulty-hard"
                      onClick={() => handleChangeDifficulty("hard")}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        activeRoom.difficulty === "hard"
                          ? "bg-amber-500/25 border-amber-400 text-white shadow-sm ring-1 ring-amber-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                          <span>⚡</span> Hard
                        </span>
                        {activeRoom.difficulty === "hard" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-300 font-semibold mt-0.5">+0.75 Speed</div>
                      <div className="text-[9px] text-amber-300/80">🦋 Save Butterflies</div>
                    </button>

                    {/* EXPERT */}
                    <button
                      type="button"
                      id="lobby-difficulty-expert"
                      onClick={() => handleChangeDifficulty("expert")}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        activeRoom.difficulty === "expert"
                          ? "bg-rose-500/25 border-rose-400 text-white shadow-sm ring-1 ring-rose-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                          <span>🔥</span> Expert
                        </span>
                        {activeRoom.difficulty === "expert" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-300 font-semibold mt-0.5">2.5x & 2x Bugs</div>
                      <div className="text-[9px] text-rose-300/80">⚠️ None must escape!</div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-800/70 border border-slate-700 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {activeRoom.difficulty === "expert"
                        ? "🔥"
                        : activeRoom.difficulty === "hard"
                        ? "⚡"
                        : "🟢"}
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Room Difficulty (Set by Host)
                      </span>
                      <span className="text-xs font-black text-white capitalize">
                        {activeRoom.difficulty || "easy"} Mode
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {activeRoom.difficulty === "expert"
                          ? "2.5x Speed, 2x Bugs, None can escape, Save Butterflies!"
                          : activeRoom.difficulty === "hard"
                          ? "1.75x Speed (+0.75), Protect Butterflies (-1 life if killed)!"
                          : "Standard 1.0x Speed, Classic rules"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/30">
                    Host Decides
                  </span>
                </div>
              )}

              {/* Connected Players in Lobby */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Connected Players ({activeRoom.players.length} / 12)</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    Arena Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {activeRoom.players.map((p) => {
                    const isMe = p.id === myPlayerId;
                    const weaponKey = activeRoom.roomWeapon || p.weapon || "shoe";
                    const w = WEAPONS[weaponKey] || WEAPONS.shoe;
                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isMe
                            ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                            : "bg-slate-800/80 border-slate-700/80 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{w.icon}</span>
                          <div>
                            <div className="text-xs font-black flex items-center gap-1.5">
                              <span className="truncate max-w-[110px]">{p.name}</span>
                              {isMe && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                                  YOU
                                </span>
                              )}
                              {p.isHost && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" />
                                  HOST
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {w.name}
                            </span>
                          </div>
                        </div>

                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Start Match Controls */}
              <div className="pt-2">
                {isCurrentPlayerHost ? (
                  <button
                    onClick={handleStartMatch}
                    id="start-multiplayer-match-button"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 animate-bounce cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>
                      Start Battle Royale! ({activeRoom.players.length} {activeRoom.players.length === 1 ? "Player" : "Players"})
                    </span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/40 rounded-2xl text-center">
                    <p className="text-xs font-bold text-indigo-300 animate-pulse flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      Waiting for Room Host to start the battle...
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Invite more friends with code <strong>{activeRoom.roomId}</strong> (up to 12 players)!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
