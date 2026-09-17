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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Cross-Device Sync</h2>
              <p className="text-xs text-sky-100 font-medium">
                Play on Mobile, Tablet & Desktop seamlessly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-sync-modal"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sync Code Box */}
          <div className="p-4 bg-sky-50/80 border-2 border-sky-200 rounded-2xl text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Your Universal Sync Key</span>
            </div>
            <div className="text-3xl font-black tracking-widest text-slate-900">
              {profile.syncKey}
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Enter this key on your phone, tablet, or PC to carry over your high scores, kill counts, and badges.
            </p>
            <div className="pt-1 flex justify-center gap-2">
              <button
                onClick={copySyncKey}
                id="copy-sync-key-button"
                className="px-4 py-2 bg-white border border-sky-300 hover:bg-sky-100/60 text-sky-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-sky-600" />}
                <span>{copied ? "Key Copied!" : "Copy Sync Key"}</span>
              </button>
              <button
                onClick={triggerCloudSync}
                id="refresh-sync-button"
                disabled={isSyncing}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync Now</span>
              </button>
            </div>
            {syncStatus && (
              <p className="text-[11px] font-bold text-sky-700 pt-1 animate-pulse">
                {syncStatus}
              </p>
            )}
          </div>

          {/* Import Key on Another Device */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Load Progress from Another Device
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. WHACK-8492"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all uppercase"
              />
              <button
                onClick={handleImportKey}
                id="restore-sync-key-button"
                disabled={isSyncing || !inputKey}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Restore
              </button>
            </div>
          </div>

          {/* Device Compatibility Badges */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-around text-center">
            <div className="flex flex-col items-center gap-1 text-slate-600">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              <span className="text-[10px] font-bold">iOS & Android</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col items-center gap-1 text-slate-600">
              <Smartphone className="w-6 h-6 text-emerald-500 rotate-90" />
              <span className="text-[10px] font-bold">Tablets & iPads</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col items-center gap-1 text-slate-600">
              <Laptop className="w-5 h-5 text-blue-500" />
              <span className="text-[10px] font-bold">Laptops & PCs</span>
            </div>
          </div>

          {/* Exterminator Badges */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Unlocked Exterminator Badges
            </span>
            <div className="grid grid-cols-1 gap-2">
              {BADGES.map((b) => {
                const isUnlocked = profile.unlockedBadges.includes(b.id) || profile.totalKills >= 10;
                return (
                  <div
                    key={b.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? "bg-amber-50/70 border-amber-200 text-slate-800"
                        : "bg-slate-50 border-slate-200 opacity-60 text-slate-400"
                    }`}
                  >
                    <span className="text-2xl">{b.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-extrabold flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {isUnlocked && (
                          <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
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
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
