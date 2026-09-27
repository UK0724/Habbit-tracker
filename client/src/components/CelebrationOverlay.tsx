import { useEffect } from "react";
import { AnimatePresence,motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Crown,Sparkles,CheckCircle2 } from "lucide-react";
import { playSound } from "../shared/lib/sounds";
import { Button } from "./ui/Button";

export interface CelebrationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  streak?: number;
  habitsCount?: number;
}

export const CelebrationOverlay = ({
  isOpen,
  onClose,
  streak,
  habitsCount
}: CelebrationOverlayProps) => {
  useEffect(() => {
    if (!isOpen) return;

    playSound("legendary");

    // Multi-shot confetti celebration burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ["#f59e0b", "#10b981", "#6366f1", "#ec4899", "#3b82f6", "#eab308"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/80 bg-gradient-to-b from-surface via-surface-2 to-surface p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.5)] cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top-Right Close Button */}
          <button
            type="button"
            aria-label="Close celebration dialog"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface-3/80 text-content-muted hover:text-content hover:bg-surface-3 transition"
          >
            ✕
          </button>

          {/* Pulsing golden aura background */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />

          {/* Crown Icon */}
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 shadow-lg shadow-amber-500/40">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              <Crown className="h-11 w-11 fill-current" />
            </motion.div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            Legendary Day Achieved!
          </div>

          <h2 className="mt-4 font-display text-2xl sm:text-3xl font-black text-content tracking-tight">
            Flawless Execution
          </h2>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-content-2">
            {habitsCount != null && habitsCount === 1
              ? "You completed your scheduled habit for today. Unstoppable momentum!"
              : habitsCount != null && habitsCount > 1
                ? `You completed all ${habitsCount} habits scheduled for today. Unstoppable momentum!`
                : "You completed all habits scheduled for today. Unstoppable momentum!"}
          </p>

          {/* Highlights */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border-app bg-surface-2 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-content-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                All Habits
              </div>
              <p className="mt-1 text-lg font-black text-emerald-400">100% Done</p>
            </div>
            <div className="rounded-2xl border border-border-app bg-surface-2 p-3 text-center">
              <div className="text-xs font-semibold text-content-muted">Bonus XP</div>
              <p className="mt-1 text-lg font-black text-amber-400">+25 XP ⭐</p>
            </div>
          </div>

          {streak !== undefined && streak > 0 && (
            <div className="mt-4 text-xs font-semibold text-orange-400">
              🔥 Current Streak: {streak} {streak === 1 ? "day" : "days"} strong!
            </div>
          )}

          <div className="mt-6">
            <Button
              type="button"
              className="w-full py-3.5 font-bold shadow-lg shadow-amber-500/25"
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
