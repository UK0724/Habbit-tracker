import { useEffect } from "react";
import { AnimatePresence,motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles,Award } from "lucide-react";
import { playSound } from "../shared/lib/sounds";
import { Button } from "./ui/Button";
import { LevelBadge } from "./ui/LevelBadge";
import { LEVEL_TITLES } from "../shared/lib/gamification";

export interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  title?: string;
  gemsReward?: number;
}

export const LevelUpModal = ({
  isOpen,
  onClose,
  level,
  title: propTitle,
  gemsReward = 1
}: LevelUpModalProps) => {
  const levelTitle = propTitle ?? LEVEL_TITLES[level - 1] ?? "Apex";

  useEffect(() => {
    if (!isOpen) return;

    playSound("levelup");

    try {
      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981"]
      });
    } catch {
      // Ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 35 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-indigo-400/60 bg-gradient-to-b from-surface via-surface-2 to-surface p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(99,102,241,0.5)] cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top-Right Close Button */}
          <button
            type="button"
            aria-label="Close level up dialog"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-3/80 text-content-muted hover:text-content hover:bg-surface-3 transition"
          >
            ✕
          </button>

          {/* Neon cosmic gradient aura */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl animate-pulse" />

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-300">
            <Award className="h-3.5 w-3.5" />
            Level Up!
          </div>

          {/* Hexagonal badge in center */}
          <div className="my-6 flex justify-center">
            <LevelBadge level={level} size="lg" showTitle={false} />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-black text-content tracking-tight">
            Level {level} Reached!
          </h2>

          <p className="mt-2 text-lg font-bold text-amber-400">
            "{levelTitle}"
          </p>

          <p className="mt-2 text-sm leading-relaxed text-content-2">
            Your persistence is unlocking new tiers of discipline and focus.
          </p>

          {/* Rewards box */}
          <div className="mt-5 rounded-2xl border border-border-app bg-surface-2 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-content-muted">
              Rewards Unlocked
            </p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 font-extrabold text-cyan-300">
                <span className="text-lg">💎</span>
                <span>+{gemsReward} Gem</span>
              </div>
              <div className="h-4 w-px bg-border-app" />
              <div className="flex items-center gap-1.5 font-extrabold text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span>New Rank</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              className="w-full py-3.5 font-bold shadow-lg shadow-indigo-500/30"
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
