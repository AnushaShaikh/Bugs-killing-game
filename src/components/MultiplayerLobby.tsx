import React, { useState, useEffect, useRef } from "react";
import { MultiplayerPlayer, MultiplayerRoom, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { Users, Copy, Check, Play, Trophy, Swords, Zap, ArrowRight, X, ArrowLeft, Shield, Crown } from "lucide-react";

interface MultiplayerLobbyProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeapon: WeaponType;
  onSelectWeapon: (weapon: WeaponType) => void;
  playerName: string;
  onStartMultiplayerMatch: (roomId: string, socket: WebSocket, isHost: boolean) => void;
  wsRef: React.MutableRefObject<WebSocket | null>;
  activeRoom: MultiplayerRoom | null;
  setActiveRoom: (room: MultiplayerRoom | null) => void;
  myPlayerId: string | null;
  setMyPlayerId: (id: string | null) => void;
  defaultJoinCode?: string;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  isOpen,
  onClose,
  selectedWeapon,
  onSelectWeapon,
  playerName,
  onStartMultiplayerMatch,
  wsRef,
  activeRoom,
  setActiveRoom,
  myPlayerId,
  setMyPlayerId,
  defaultJoinCode = "",
}) => {
  const [joinCode, setJoinCode] = useState(defaultJoinCode);
  const [statusMsg, setStatusMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const isHost = useRef(false);

  // Check URL param ?room=CODE if any
  useEffect(() => {
    if (defaultJoinCode) {
      setJoinCode(defaultJoinCode.toUpperCase());
    } else {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("room");
      if (codeFromUrl) {
        setJoinCode(codeFromUrl.toUpperCase());
      }
    }
  }, [defaultJoinCode]);

  // Connect or reuse WebSocket
  const connectSocket = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return resolve(wsRef.current);
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onerror = (err) => {
        console.error("Multiplayer WS error:", err);
        reject(err);
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    });
  };

  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setStatusMsg("Creating room arena...");
    try {
      const ws = await connectSocket();
      isHost.current = true;

      ws.send(
        JSON.stringify({
          type: "create_room",
          name: playerName || "HostPlayer",
          weapon: selectedWeapon,
        })
      );
    } catch (e) {
      setStatusMsg("Failed to connect to multiplayer server.");
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setStatusMsg("Please enter a room code.");
      return;
    }
    setIsConnecting(true);
    setStatusMsg(`Joining room ${code}...`);
    try {
      const ws = await connectSocket();
      isHost.current = false;

      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId: code,
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

  const copyRoomCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomLink = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}?room=${activeRoom.roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                {activeRoom ? `Room Code: ${activeRoom.roomId}` : "Play together with friends on any device"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {!activeRoom ? (
            /* Option A: Create or Join a Room */
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto mb-3">
                  ⚔️
                </div>
                <h3 className="text-lg font-black text-white">
                  Join or Create a Battle Room
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Play with up to 12 friends simultaneously. Last player standing wins, and eliminated players spectate live!
                </p>
              </div>

              {/* Action 1: Create Room */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                    Option 1: Host a Game
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">You are Host</span>
                </div>
                <button
                  onClick={handleCreateRoom}
                  id="create-room-button"
                  disabled={isConnecting}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Create Room for Friends (Up to 12)</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  OR JOIN WITH CODE
                </span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              {/* Action 2: Join Room with Code */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  Option 2: Enter Room Code
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="ENTER 5-LETTER CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    className="flex-1 px-4 py-3 bg-slate-900 border-2 border-slate-700 rounded-xl text-center font-black tracking-widest text-base text-white uppercase placeholder:tracking-normal placeholder:font-bold placeholder:text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    onClick={handleJoinRoom}
                    id="join-room-button"
                    disabled={isConnecting || !joinCode.trim()}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <span>Join Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {statusMsg && (
                <p className="text-center text-xs font-bold text-amber-400 animate-pulse">
                  {statusMsg}
                </p>
              )}
            </div>
          ) : (
            /* Option B: Inside an Active Room Lobby (Waiting for match start) */
            <div className="space-y-4">
              {/* Room Code Card */}
              <div className="p-4 bg-indigo-950/40 border-2 border-indigo-500/50 rounded-2xl text-center relative">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  Room Invite Code (Share with Friends)
                </span>
                <div className="text-3xl font-black tracking-widest text-white mt-1">
                  {activeRoom.roomId}
                </div>

                <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={copyRoomCode}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Code Copied!" : "Copy Code"}</span>
                  </button>
                  <button
                    onClick={copyRoomLink}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Copy Direct Link</span>
                  </button>
                </div>
              </div>

              {/* Weapon Selector for Lobby */}
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Your Weapon
                  </span>
                  <span className="text-[11px] font-black text-amber-300">
                    {WEAPONS[selectedWeapon]?.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["shoe", "newspaper", "swatter"] as WeaponType[]).map((wKey) => {
                    const w = WEAPONS[wKey];
                    const isSelected = selectedWeapon === wKey;
                    return (
                      <button
                        key={wKey}
                        onClick={() => handleChangeLobbyWeapon(wKey)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-400 text-white"
                            : "bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xl">{w.icon}</span>
                        <div className="text-left">
                          <div className="text-xs font-black truncate">{w.name}</div>
                          <div className="text-[9px] opacity-75">{w.perk}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connected Players Grid (Supports up to 12 players!) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Connected Players ({activeRoom.players.length}/12)</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Lobby
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {activeRoom.players.map((p) => {
                    const w = WEAPONS[p.weapon] || WEAPONS.shoe;
                    const isMe = p.id === myPlayerId;
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
                              <span className="truncate max-w-[120px]">{p.name}</span>
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
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 animate-bounce"
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
                      Invite friends with code <strong>{activeRoom.roomId}</strong> (up to 12 players)!
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
