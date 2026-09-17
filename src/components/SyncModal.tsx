import React, { useState, useEffect } from "react";
import { UserProfile, WeaponType } from "../types";
import { Cloud, Check, Copy, RefreshCw, Award, Smartphone, Laptop, X, ShieldCheck } from "lucide-react";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

const BADGES = [
  { id: "first_blood", name: "First Squish", desc: "Squashed your very first bug", icon: "🐜" },
  { id: "slipper_slayer", name: "Slipper Master", desc: "Eliminated 25 bugs with the Slipper", icon: "🩴" },
  { id: "paper_ninja", name: "Paper Ninja", desc: "Achieved 85%+ accuracy in a single match", icon: "🗞️" },
  { id: "zap_king", name: "Zap Virtuoso", desc: "Reached a 10x bug kill combo streak", icon: "⚡" },
  { id: "hundred_club", name: "Kitchen Defender", desc: "Over 100 total lifetime bugs exterminated", icon: "🏆" },
];

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [inputKey, setInputKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      triggerCloudSync();
    }
  }, [isOpen]);

  const triggerCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Saving progress to cloud...");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        onProfileUpdated(data.profile);
        setSyncStatus("Synced seamlessly across all devices!");
      }
    } catch (e) {
      setSyncStatus("Offline mode active. Local progress saved.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportKey = async () => {
    const key = inputKey.trim().toUpperCase();
    if (!key) return;

    setIsSyncing(true);
    setSyncStatus(`Restoring progress for ${key}...`);
    try {
      const res = await fetch(`/api/sync/${key}`);
      if (res.ok) {
        const remoteProfile = await res.json();
        onProfileUpdated(remoteProfile);
        setSyncStatus("Progress synchronized successfully!");
        setInputKey("");
      } else {
        setSyncStatus("Sync key not found on server.");
      }
    } catch {
      setSyncStatus("Error connecting to sync server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const copySyncKey = () => {
    navigator.clipboard.writeText(profile.syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
              <Cloud className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Cross-Device Sync</h2>
              <p className="text-xs text-slate-500 font-normal">
                Seamless progression across desktop & mobile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-sync-modal"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Sync Code Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Universal Sync Key</span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-widest text-slate-900">
              {profile.syncKey}
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Enter this key on any other device to load high scores and unlocked badges.
            </p>
            <div className="pt-1 flex justify-center gap-2">
              <button
                onClick={copySyncKey}
                id="copy-sync-key-button"
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? "Copied" : "Copy Key"}</span>
              </button>
              <button
                onClick={triggerCloudSync}
                id="refresh-sync-button"
                disabled={isSyncing}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-amber-500" : "text-slate-500"}`} />
                <span>Sync Now</span>
              </button>
            </div>
            {syncStatus && (
              <p className="text-[11px] text-amber-700 font-medium pt-0.5">
                {syncStatus}
              </p>
            )}
          </div>

          {/* Import Key on Another Device */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Load Profile From Another Device
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WHACK-8492"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 uppercase shadow-xs"
              />
              <button
                onClick={handleImportKey}
                id="restore-sync-key-button"
                disabled={isSyncing || !inputKey}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] disabled:opacity-40 text-white rounded-lg font-semibold text-xs tracking-wide transition-colors shadow-xs cursor-pointer"
              >
                Restore
              </button>
            </div>
          </div>

          {/* Device Compatibility Badges */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-around text-center shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
              <Smartphone className="w-4 h-4 text-slate-500" />
              <span>Mobile</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
              <Smartphone className="w-4 h-4 text-slate-500 rotate-90" />
              <span>Tablet</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
              <Laptop className="w-4 h-4 text-slate-500" />
              <span>Desktop</span>
            </div>
          </div>

          {/* Exterminator Badges */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Achievements
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {BADGES.map((b) => {
                const isUnlocked = profile.unlockedBadges.includes(b.id) || profile.totalKills >= 10;
                return (
                  <div
                    key={b.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-colors ${
                      isUnlocked
                        ? "bg-slate-50 border-slate-200 text-slate-800"
                        : "bg-slate-50/40 border-slate-200/50 opacity-50 text-slate-400"
                    }`}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-semibold flex items-center gap-1.5 text-slate-900">
                        <span>{b.name}</span>
                        {isUnlocked && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded font-mono">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {b.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors border border-slate-200 cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
