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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm select-none overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back to menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 text-slate-900">
                <span>Multiplayer Arena</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Up to 12
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {activeRoom ? `Room Code: ${activeRoom.roomId}` : "Compete with friends in real-time"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                connectionStatus === "connected"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : connectionStatus === "connecting"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              {connectionStatus === "connected" ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Online</span>
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-600" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-rose-600" />
                  <span>Offline</span>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto bg-white">
          {/* Server Error Alert Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Connection Notice</div>
                    <div className="text-xs text-rose-700 mt-0.5">{errorMessage}</div>
                  </div>
                </div>
                {onClearError && (
                  <button
                    onClick={onClearError}
                    className="p-1 rounded hover:bg-rose-100 text-rose-600 hover:text-rose-900 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200">
                <button
                  type="button"
                  onClick={() => {
                    if (onClearError) onClearError();
                    handleCreateRoom();
                  }}
                  className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Host New Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearError) onClearError();
                    loadOpenRooms();
                  }}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Rooms</span>
                </button>
              </div>
            </div>
          )}

          {!activeRoom ? (
            /* Option A: Create or Join a Room */
            <div className="space-y-3.5">
              {/* Action 1: Create Room */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Host a Match
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Host chooses rules
                  </span>
                </div>

                {/* Pre-select Weapon for the Room */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Default Weapon:</span>
                    <span className="text-amber-700 font-semibold">{WEAPONS[selectedWeapon]?.name}</span>
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
                          className={`p-2 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300 text-slate-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span className="text-base">{w.icon}</span>
                          <div className="text-left truncate">
                            <div className="text-xs font-medium truncate">{w.name}</div>
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
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-lg font-semibold text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  <Users className="w-4 h-4" />
                  <span>{isConnecting ? "Creating Arena..." : "Create Room (Up to 12 Players)"}</span>
                </button>
              </div>

              {/* Action 2: Join Room with Code */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-xs">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block">
                  Join with Code
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="ENTER CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoomWithCode()}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-center font-mono font-semibold tracking-wider text-sm text-slate-900 uppercase placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
                  />
                  <button
                    onClick={() => handleJoinRoomWithCode()}
                    id="join-room-button"
                    disabled={isConnecting || !joinCode.trim()}
                    className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-lg font-semibold text-xs tracking-wide transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer shadow-xs"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action 3: Live Active Rooms in Waiting State */}
              {openRooms.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-600" />
                      Active Rooms ({openRooms.length})
                    </span>
                    <button
                      onClick={loadOpenRooms}
                      disabled={isRefreshingRooms}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
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
                          className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:border-slate-300 transition-colors shadow-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{weaponInfo.icon}</span>
                            <div>
                              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                <span className="tracking-wider font-mono text-slate-700">{room.id}</span>
                                <span className="text-slate-500 font-normal">by {room.hostName}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{room.playerCount} / {room.maxPlayers} players</span>
                                <span>•</span>
                                <span>{weaponInfo.name}</span>
                                <span>•</span>
                                <span className="font-medium text-amber-700 capitalize">{room.difficulty || "easy"}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleJoinRoomWithCode(room.id)}
                            disabled={isConnecting}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 shadow-xs"
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
                <p className="text-center text-xs font-medium text-amber-700">
                  {statusMsg}
                </p>
              )}
            </div>
          ) : (
            /* Option B: Inside an Active Room Lobby (Waiting for match start) */
            <div className="space-y-3.5">
              {/* Room Code & Invite Share Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center relative shadow-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Room Invite Code
                </span>
                <div className="text-3xl font-bold tracking-widest text-slate-900 mt-0.5 font-mono">
                  {activeRoom.roomId}
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={copyRoomCode}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedType === "code" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedType === "code" ? "Copied" : "Copy Code"}</span>
                  </button>

                  <button
                    onClick={copyRoomLink}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedType === "link" ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedType === "link" ? "Link Copied" : "Copy Invite Link"}</span>
                  </button>

                  <button
                    onClick={handleOpenInNewTab}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Open this room in a new browser tab to battle"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open New Tab</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 mt-2 bg-white p-2 rounded-lg border border-slate-200 shadow-xs">
                  Tip: Open this room in a new browser tab to test multiplayer directly from two windows.
                </p>
              </div>

              {/* Room Weapon Section: Host controls it */}
              {isCurrentPlayerHost ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs uppercase font-semibold text-slate-800 tracking-wider">
                        Match Weapon
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Applied to all players
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
                          className={`p-2 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300 text-slate-900 font-semibold shadow-xs"
                              : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
                          }`}
                        >
                          <span className="text-lg">{w.icon}</span>
                          <div className="text-left truncate">
                            <div className="text-xs font-medium truncate">{w.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{WEAPONS[activeRoom.roomWeapon || "shoe"]?.icon}</span>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium uppercase block">
                        Match Weapon (Host Selected)
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {WEAPONS[activeRoom.roomWeapon || "shoe"]?.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Host Decides
                  </span>
                </div>
              )}

              {/* Room Difficulty Section: Host controls it */}
              {isCurrentPlayerHost ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs uppercase font-semibold text-slate-800 tracking-wider">
                        Room Difficulty
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Host Decides
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* EASY */}
                    <button
                      type="button"
                      id="lobby-difficulty-easy"
                      onClick={() => handleChangeDifficulty("easy")}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        (activeRoom.difficulty || "easy") === "easy"
                          ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Easy
                        </span>
                        {(activeRoom.difficulty || "easy") === "easy" && (
                          <Check className="w-3 h-3 text-emerald-700" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-800 font-medium mt-1">1.0x Speed</div>
                      <div className="text-[10px] text-slate-500">Standard bugs</div>
                    </button>

                    {/* HARD */}
                    <button
                      type="button"
                      id="lobby-difficulty-hard"
                      onClick={() => handleChangeDifficulty("hard")}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeRoom.difficulty === "hard"
                          ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          Hard
                        </span>
                        {activeRoom.difficulty === "hard" && (
                          <Check className="w-3 h-3 text-amber-700" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-800 font-medium mt-1">+0.75 Speed</div>
                      <div className="text-[10px] text-amber-700">Save butterflies</div>
                    </button>

                    {/* EXPERT */}
                    <button
                      type="button"
                      id="lobby-difficulty-expert"
                      onClick={() => handleChangeDifficulty("expert")}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeRoom.difficulty === "expert"
                          ? "bg-rose-50 border-rose-300 ring-1 ring-rose-300 text-slate-900 shadow-xs"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Expert
                        </span>
                        {activeRoom.difficulty === "expert" && (
                          <Check className="w-3 h-3 text-rose-700" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-800 font-medium mt-1">2.5x & 2x Bugs</div>
                      <div className="text-[10px] text-rose-700">Zero escapes</div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase block">
                      Room Difficulty (Host Selected)
                    </span>
                    <span className="text-xs font-semibold text-slate-900 capitalize">
                      {activeRoom.difficulty || "easy"} Mode
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {activeRoom.difficulty === "expert"
                        ? "2.5x Speed, 2x Bugs, None can escape, Protect Butterflies"
                        : activeRoom.difficulty === "hard"
                        ? "1.75x Speed, Protect Butterflies (-1 life if killed)"
                        : "Standard 1.0x Speed, Classic rules"}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Host Decides
                  </span>
                </div>
              )}

              {/* Connected Players in Lobby */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Connected Players ({activeRoom.players.length} / 12)</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    Ready
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
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                          isMe
                            ? "bg-amber-50/70 border-amber-200 text-slate-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{w.icon}</span>
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5 text-slate-900">
                              <span className="truncate max-w-[110px]">{p.name}</span>
                              {isMe && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  YOU
                                </span>
                              )}
                              {p.isHost && (
                                <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5 text-amber-500" />
                                  HOST
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {w.name}
                            </span>
                          </div>
                        </div>

                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
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
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white rounded-xl font-semibold text-xs sm:text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      Start Match ({activeRoom.players.length} {activeRoom.players.length === 1 ? "Player" : "Players"})
                    </span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-xs">
                    <p className="text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Waiting for host to start the match...
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Room code: <strong className="text-slate-800">{activeRoom.roomId}</strong>
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
