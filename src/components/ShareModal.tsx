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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
              <Share2 className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Share Achievement</h2>
              <p className="text-xs text-slate-500 font-normal">Challenge peers or record result</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-share-modal"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Victory Card Preview */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-5 text-center shadow-xs">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600 text-[10px] font-semibold uppercase tracking-wider mb-2 shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Score Certificate</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {playerName || "Player"}
            </h3>

            {/* Score */}
            <div className="my-2">
              <div className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                {stats.score.toLocaleString()}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Total Score
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center">
              <div>
                <span className="text-xs font-semibold font-mono text-slate-800 block">
                  {stats.kills}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Smashed
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold font-mono text-slate-800 block">
                  {stats.accuracy}%
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Accuracy
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  {activeWeapon.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
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
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to Applications</span>
            </button>

            {/* Quick platform buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={shareToWhatsApp}
                id="share-whatsapp-button"
                className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={shareToTwitter}
                id="share-twitter-button"
                className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Twitter className="w-3.5 h-3.5 text-slate-500" />
                <span>X</span>
              </button>

              <button
                onClick={copyShareText}
                id="copy-share-text-button"
                className="py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
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
