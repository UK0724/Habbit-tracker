import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "../../shared/lib/utils";

export interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const StreakBadge = ({
  streak,
  size = "md",
  showLabel = false,
  className
}: StreakBadgeProps) => {
  const isHot = streak >= 7;
  const isInferno = streak >= 30;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
    lg: "px-3.5 py-1.5 text-base gap-2"
  }[size];

  const iconSizes = {
    sm: 14,
    md: 17,
    lg: 20
  }[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex items-center rounded-full font-bold transition-all select-none",
        sizeClasses,
        isInferno
          ? "border border-amber-400 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-[0_0_16px_rgba(245,158,11,0.6)]"
          : isHot
            ? "border border-orange-500/40 bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.35)]"
            : "border border-border-app bg-surface-2 text-content-2",
        className
      )}
    >
      <motion.span
        animate={
          isHot
            ? {
                scale: [1, 1.22, 1],
                rotate: [0, -7, 7, 0]
              }
            : undefined
        }
        transition={
          isHot
            ? {
                repeat: Infinity,
                duration: 1.8,
                ease: "easeInOut"
              }
            : undefined
        }
        className="flex items-center justify-center"
      >
        <Flame
          size={iconSizes}
          className={cn(
            isInferno
              ? "fill-white text-white drop-shadow-sm"
              : isHot
                ? "fill-orange-500 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                : "text-orange-400 fill-orange-400/50"
          )}
        />
      </motion.span>
      <span className="font-extrabold tracking-tight">
        {streak}
        {showLabel && (
          <span className="ml-1 font-medium opacity-80 text-xs">
            {streak === 1 ? "day" : "days"}
          </span>
        )}
      </span>
    </motion.div>
  );
};
