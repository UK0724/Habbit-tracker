import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles, Award } from "lucide-react";
import { playSound } from "../shared/lib/sounds";
import { useDialog } from "../shared/hooks/useDialog";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";
import { Button } from "./ui/Button";
import { LevelBadge } from "./ui/LevelBadge";

export interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  /** Server-provided level title (reward.levelUp.title). */
  title?: string;
  /** Gems granted for the level-up; hidden when 0. */
  gemsReward?: number;
}

export const LevelUpModal = ({
  isOpen,
  onClose,
  level,
  title,
  gemsReward = 0
}: LevelUpModalProps) => {
  const reducedMotion = useReducedMotion();
  useDialog(isOpen, onClose, "[data-level-up-dialog]");

  useEffect(() => {
    if (!isOpen) return;
    playSound("levelup");
    if (reducedMotion) return;
    try {
      void confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981"],
        disableForReducedMotion: true
      });
    } catch {
      // Ignore
    }
  }, [isOpen, reducedMotion]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        data-level-up-dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-up-title"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.75, y: 35 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { type: "spring", stiffness: 320, damping: 24 }
        }
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-indigo-400/60 bg-gradient-to-b from-surface via-surface-2 to-surface p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(99,102,241,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface-3/80 text-content-muted hover:text-content hover:bg-surface-3 transition"
        >
          ✕
        </button>

        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl" />

        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-300">
          <Award className="h-3.5 w-3.5" />
          Level Up!
        </div>

        <div className="my-6 flex justify-center">
          <LevelBadge level={level} size="lg" showTitle={false} />
        </div>

        <h2
          id="level-up-title"
          className="font-display text-3xl sm:text-4xl font-black text-content tracking-tight"
        >
          Level {level} reached!
        </h2>

        {title ? (
          <p className="mt-2 text-lg font-bold text-amber-400">“{title}”</p>
        ) : null}

        <p className="mt-2 text-sm leading-relaxed text-content-2">
          Your persistence is unlocking new tiers of discipline and focus.
        </p>

        <div className="mt-5 rounded-2xl border border-border-app bg-surface-2 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-content-muted">
            Rewards unlocked
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            {gemsReward > 0 ? (
              <>
                <div className="flex items-center gap-1.5 font-extrabold text-cyan-300">
                  <span className="text-lg" aria-hidden>
                    💎
                  </span>
                  <span>
                    +{gemsReward} {gemsReward === 1 ? "gem" : "gems"}
                  </span>
                </div>
                <div className="h-4 w-px bg-border-app" />
              </>
            ) : null}
            <div className="flex items-center gap-1.5 font-extrabold text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>New rank</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            className="w-full py-3.5 font-bold shadow-lg shadow-indigo-500/30"
            onClick={onClose}
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
