import React, { useState } from "react";
import { GameStats, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";
import { Share2, Check, Copy, X, Twitter, MessageCircle, Sparkles, Award } from "lucide-react";
import confetti from "canvas-confetti";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  weapon: WeaponType;
  playerName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  stats,
  weapon,
  playerName,
}) => {
  const [copied, setCopied] = useState(false);
  const activeWeapon = WEAPONS[weapon] || WEAPONS.shoe;

  if (!isOpen) return null;

  const shareText = `🪰 I just squashed ${stats.kills} bugs with ${activeWeapon.name} for ${stats.score.toLocaleString()} points on Bug Whacker! Can you beat my high score? 💥`;
  const shareUrl = window.location.href;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bug Whacker - High Score Challenge!",
          text: shareText,
          url: shareUrl,
        });
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      copyShareText();
    }
  };

  const copyShareText = () => {
    navigator.clipboard.writeText(`${shareText}\nPlay now: ${shareUrl}`);
    setCopied(true);
    confetti({ particleCount: 40, spread: 50 });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank");
  };

  const shareToWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText} ${shareUrl}`
    )}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Share Achievement</h2>
              <p className="text-[11px] text-pink-100 font-medium">Challenge your friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-share-modal"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Victory Card Preview */}
        <div className="p-5 space-y-4">
          <div className="relative bg-gradient-to-b from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 text-center shadow-inner overflow-hidden">
            {/* Background watermarks */}
            <div className="absolute top-2 right-2 text-3xl opacity-20 select-none">🪰</div>
            <div className="absolute bottom-2 left-2 text-3xl opacity-20 select-none">💥</div>

            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-200/80 rounded-full text-amber-900 text-[10px] font-black uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>Certified Bug Smasher</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {playerName || "Hero Smasher"}
            </h3>

            {/* Big Score */}
            <div className="my-2">
              <div className="text-4xl font-black text-amber-600 tracking-tight drop-shadow-sm">
                {stats.score.toLocaleString()}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                TOTAL POINTS
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/80 text-center">
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  {stats.kills}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold uppercase">
                  Squashed
                </span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  {stats.accuracy}%
                </span>
                <span className="text-[9px] text-slate-500 font-semibold uppercase">
                  Accuracy
                </span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block flex items-center justify-center gap-1">
                  <span>{activeWeapon.icon}</span>
                </span>
                <span className="text-[9px] text-slate-500 font-semibold uppercase">
                  Weapon
                </span>
              </div>
            </div>
          </div>

          {/* Share Action Buttons */}
          <div className="space-y-2">
            {/* Native Mobile Share if supported */}
            <button
              onClick={handleNativeShare}
              id="native-share-button"
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to Socials & Chat</span>
            </button>

            {/* Quick platform buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={shareToWhatsApp}
                id="share-whatsapp-button"
                className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={shareToTwitter}
                id="share-twitter-button"
                className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                <span>X / Twitter</span>
              </button>

              <button
                onClick={copyShareText}
                id="copy-share-text-button"
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
