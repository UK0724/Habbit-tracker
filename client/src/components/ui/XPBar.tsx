import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "../../shared/lib/utils";

export interface XPBarProps {
  currentXP: number;
  neededXP: number | null;
  level?: number;
  levelTitle?: string;
  percent?: number;
  compact?: boolean;
  className?: string;
}

export const XPBar = ({
  currentXP,
  neededXP,
  level,
  levelTitle,
  percent: propPercent,
  compact = false,
  className
}: XPBarProps) => {
  const isMaxLevel = neededXP === null || neededXP <= 0;
  const calculatedPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.max(0, (currentXP / neededXP) * 100));
  const percent = propPercent !== undefined ? propPercent : calculatedPercent;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {level !== undefined && (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
            <Sparkles className="h-3.5 w-3.5" />
            Lv.{level}
          </span>
        )}
        <div className="relative h-2 w-28 sm:w-36 overflow-hidden rounded-full bg-surface-3 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="text-[11px] font-medium text-content-muted">
          {Math.round(percent)}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-surface to-surface-2 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {level !== undefined && (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-xs font-black text-white shadow-md shadow-amber-500/30">
              {level}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-content">
                {levelTitle ?? `Level ${level ?? 1}`}
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>
            <p className="text-xs text-content-muted">
              {isMaxLevel
                ? "Max Level Reached"
                : `${currentXP.toLocaleString()} / ${neededXP?.toLocaleString()} XP to Next Level`}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-500">
          {Math.round(percent)}%
        </span>
      </div>

      <div className="relative mt-3 h-3 w-full overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className="relative h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Moving shimmer light beam */}
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-100%", "500%"] }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "linear",
              repeatDelay: 1
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
