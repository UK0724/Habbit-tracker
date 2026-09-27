import { useEffect } from "react";
import { AnimatePresence,motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy,Sparkles } from "lucide-react";
import { playSound } from "../shared/lib/sounds";
import { Button } from "./ui/Button";
import type { AchievementTier } from "../shared/lib/gamification";

export interface AchievementBannerProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: {
    id: string;
    name: string;
    description: string;
    xpBonus: number;
    tier?: AchievementTier;
    emoji?: string;
  } | null;
}

export const AchievementBanner = ({
  isOpen,
  onClose,
  achievement
}: AchievementBannerProps) => {
  useEffect(() => {
    if (isOpen && achievement) {
      playSound("achievement");
      try {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#fbbf24", "#6366f1", "#10b981", "#ec4899"]
        });
      } catch {
        // Fallback if canvas-confetti fails
      }
    }
  }, [isOpen, achievement]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !achievement) return null;

  const tierColors: Record<string, { ring: string; glow: string; badge: string }> = {
    bronze: {
      ring: "border-amber-700/60",
      glow: "shadow-[0_0_35px_rgba(180,83,9,0.5)]",
      badge: "from-amber-700 to-amber-900 text-amber-100"
    },
    silver: {
      ring: "border-slate-400/60",
      glow: "shadow-[0_0_35px_rgba(148,163,184,0.5)]",
      badge: "from-slate-400 to-slate-600 text-slate-100"
    },
    gold: {
      ring: "border-yellow-400/80",
      glow: "shadow-[0_0_45px_rgba(234,179,8,0.7)]",
      badge: "from-yellow-400 to-amber-600 text-amber-950"
    },
    platinum: {
      ring: "border-cyan-300/80",
      glow: "shadow-[0_0_50px_rgba(6,182,212,0.8)]",
      badge: "from-cyan-400 to-blue-600 text-white"
    }
  };

  const defaultTierStyle = {
    ring: "border-yellow-400/80",
    glow: "shadow-[0_0_45px_rgba(234,179,8,0.7)]",
    badge: "from-yellow-400 to-amber-600 text-amber-950"
  };

  const currentTier: AchievementTier = achievement.tier ?? "gold";
  const tierStyle = tierColors[currentTier] ?? defaultTierStyle;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      >
        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${tierStyle.ring} bg-gradient-to-b from-surface via-surface-2 to-surface p-6 sm:p-8 text-center ${tierStyle.glow} cursor-default`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top-Right Close Button */}
          <button
            type="button"
            aria-label="Close achievement dialog"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-3/80 text-content-muted hover:text-content hover:bg-surface-3 transition"
          >
            ✕
          </button>

          {/* Decorative radiating background */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-400">
            <Trophy className="h-3.5 w-3.5" />
            Achievement Unlocked!
          </div>

          {/* Emoji Badge with animation */}
          <div className="relative my-6 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, -6, 6, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut"
              }}
              className="flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-400/20 via-surface-3 to-surface text-5xl shadow-xl select-none"
            >
              {achievement.emoji ?? "🏆"}
            </motion.div>
          </div>

          {/* Title & Description */}
          <h2 className="font-display text-2xl sm:text-3xl font-black text-content tracking-tight">
            {achievement.name}
          </h2>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-content-2">
            {achievement.description}
          </p>

          {/* XP Bonus Pill */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-2 font-black text-amber-400 shadow-inner">
            <Sparkles className="h-4 w-4 text-amber-400 animate-spin" />
            <span>+{achievement.xpBonus} XP Earned</span>
            <span className="text-sm">⭐</span>
          </div>

          {/* Action button */}
          <div className="mt-7">
            <Button
              type="button"
              className="w-full py-3.5 font-bold shadow-lg shadow-amber-500/20"
              onClick={onClose}
            >
              Close &amp; Continue
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
