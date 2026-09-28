import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Sparkles } from "lucide-react";
import { playSound } from "../shared/lib/sounds";
import { useDialog } from "../shared/hooks/useDialog";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";
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
    gemBonus?: number;
    tier?: AchievementTier;
    emoji?: string;
  } | null;
}

const tierColors: Record<AchievementTier, { ring: string; glow: string }> = {
  bronze: {
    ring: "border-amber-700/60",
    glow: "shadow-[0_0_35px_rgba(180,83,9,0.5)]"
  },
  silver: {
    ring: "border-slate-400/60",
    glow: "shadow-[0_0_35px_rgba(148,163,184,0.5)]"
  },
  gold: {
    ring: "border-yellow-400/80",
    glow: "shadow-[0_0_45px_rgba(234,179,8,0.7)]"
  },
  platinum: {
    ring: "border-cyan-300/80",
    glow: "shadow-[0_0_50px_rgba(6,182,212,0.8)]"
  }
};

export const AchievementBanner = ({
  isOpen,
  onClose,
  achievement
}: AchievementBannerProps) => {
  const reducedMotion = useReducedMotion();
  const open = isOpen && Boolean(achievement);
  useDialog(open, onClose, "[data-achievement-dialog]");

  useEffect(() => {
    if (!open) return;
    playSound("achievement");
    if (reducedMotion) return;
    try {
      void confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#fbbf24", "#6366f1", "#10b981", "#ec4899"],
        disableForReducedMotion: true
      });
    } catch {
      // Fallback if canvas-confetti fails
    }
  }, [open, achievement?.id, reducedMotion]);

  if (!open || !achievement) return null;

  const tierStyle = tierColors[achievement.tier ?? "gold"] ?? tierColors.gold;
  const gemBonus = achievement.gemBonus ?? 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        data-achievement-dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
        aria-describedby="achievement-description"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 30 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { type: "spring", stiffness: 350, damping: 25 }
        }
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${tierStyle.ring} bg-gradient-to-b from-surface via-surface-2 to-surface p-6 sm:p-8 text-center ${tierStyle.glow}`}
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

        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-400">
          <Trophy className="h-3.5 w-3.5" />
          Badge unlocked
        </div>

        <div className="relative my-6 flex items-center justify-center">
          <motion.div
            animate={
              reducedMotion
                ? undefined
                : { scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] }
            }
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-400/20 via-surface-3 to-surface text-5xl shadow-xl select-none"
            aria-hidden
          >
            {achievement.emoji ?? "🏆"}
          </motion.div>
        </div>

        <h2
          id="achievement-title"
          className="font-display text-2xl sm:text-3xl font-black text-content tracking-tight"
        >
          {achievement.name}
        </h2>
        <p
          id="achievement-description"
          className="mt-2 text-sm sm:text-base leading-relaxed text-content-2"
        >
          {achievement.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {achievement.xpBonus > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-2 font-black text-amber-400">
              <Sparkles className="h-4 w-4" aria-hidden />+{achievement.xpBonus} XP
            </span>
          ) : null}
          {gemBonus > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 font-black text-cyan-400">
              <span aria-hidden>💎</span>+{gemBonus}{" "}
              {gemBonus === 1 ? "gem" : "gems"}
            </span>
          ) : null}
        </div>

        <div className="mt-7">
          <Button
            type="button"
            className="w-full py-3.5 font-bold shadow-lg shadow-amber-500/20"
            onClick={onClose}
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
