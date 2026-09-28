import { motion } from "framer-motion";
import { Sparkles, X, Flame } from "lucide-react";
import { cn } from "../shared/lib/utils";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";

export interface DailyCheckInBannerProps {
  /** Streak returned by the check-in. */
  streak: number;
  xpAwarded?: number;
  freezeUsed?: boolean;
  onDismiss: () => void;
  className?: string;
}

export const DailyCheckInBanner = ({
  streak,
  xpAwarded = 0,
  freezeUsed = false,
  onDismiss,
  className
}: DailyCheckInBannerProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      role="status"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.3, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-surface-2 p-3.5 sm:p-4 text-content shadow-sm",
        className
      )}
    >
      <div className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-500/30">
            <Flame className="h-5 w-5 fill-white" aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-sm sm:text-base font-bold text-content">
                Day {streak} — you showed up! 🔥
              </h2>
              {xpAwarded > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-extrabold text-amber-400">
                  <Sparkles className="h-3 w-3" aria-hidden />+{xpAwarded} XP
                </span>
              )}
            </div>
            <p className="text-xs text-content-muted">
              {freezeUsed
                ? "A streak freeze covered the day you missed, so your streak is safe."
                : "Daily check-in complete. Keep your streak going today!"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-content-muted hover:bg-surface-3 hover:text-content transition"
          aria-label="Dismiss check-in message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};
