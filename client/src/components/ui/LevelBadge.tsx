import { motion } from "framer-motion";
import { cn } from "../../shared/lib/utils";

export interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  className?: string;
}

export const LevelBadge = ({
  level,
  title,
  size = "md",
  showTitle = true,
  className
}: LevelBadgeProps) => {
  // Color themes based on level brackets
  const getTheme = (lvl: number) => {
    if (lvl >= 75) {
      return {
        bg: "from-purple-600 via-pink-500 to-amber-400",
        border: "border-purple-400/70",
        glow: "shadow-[0_0_20px_rgba(216,180,254,0.6)]",
        text: "text-purple-300",
        labelColor: "from-purple-400 to-pink-400"
      };
    }
    if (lvl >= 50) {
      return {
        bg: "from-indigo-600 via-violet-600 to-purple-600",
        border: "border-indigo-400/60",
        glow: "shadow-[0_0_16px_rgba(99,102,241,0.5)]",
        text: "text-indigo-300",
        labelColor: "from-indigo-400 to-violet-400"
      };
    }
    if (lvl >= 25) {
      return {
        bg: "from-amber-500 via-yellow-500 to-orange-500",
        border: "border-amber-400/60",
        glow: "shadow-[0_0_16px_rgba(245,158,11,0.5)]",
        text: "text-amber-400",
        labelColor: "from-amber-400 to-yellow-400"
      };
    }
    if (lvl >= 10) {
      return {
        bg: "from-cyan-500 via-blue-500 to-indigo-500",
        border: "border-cyan-400/60",
        glow: "shadow-[0_0_14px_rgba(6,182,212,0.4)]",
        text: "text-cyan-400",
        labelColor: "from-cyan-400 to-blue-400"
      };
    }
    return {
      bg: "from-emerald-500 to-teal-600",
      border: "border-emerald-400/40",
      glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
      text: "text-emerald-400",
      labelColor: "from-emerald-400 to-teal-400"
    };
  };

  const theme = getTheme(level);

  const hexDimensions = {
    sm: { w: 32, h: 36, font: "text-xs font-black" },
    md: { w: 46, h: 52, font: "text-sm font-black" },
    lg: { w: 60, h: 68, font: "text-lg font-black" }
  }[size];

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <motion.div
        whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
        className={cn(
          "relative flex items-center justify-center select-none",
          theme.glow
        )}
        style={{ width: hexDimensions.w, height: hexDimensions.h }}
      >
        {/* Hexagon SVG shape with gradient and border */}
        <svg
          viewBox="0 0 100 115"
          className="absolute inset-0 h-full w-full drop-shadow-md overflow-visible"
        >
          <defs>
            <linearGradient
              id={`hex-grad-${level}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${level}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hexagon Path */}
          <polygon
            points="50 3, 97 29, 97 86, 50 112, 3 86, 3 29"
            className={cn("fill-surface-card stroke-2", theme.border)}
          />

          {/* Inner Hexagon Fill with gradient */}
          <polygon
            points="50 9, 91 32, 91 83, 50 106, 9 83, 9 32"
            className={cn("bg-gradient-to-br fill-current opacity-90", theme.text)}
          />
        </svg>

        {/* Level text centered */}
        <span
          className={cn(
            "relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]",
            hexDimensions.font
          )}
        >
          {level}
        </span>
      </motion.div>

      {showTitle && title && (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
            Level {level}
          </span>
          <span
            className={cn(
              "font-display font-extrabold text-sm sm:text-base bg-gradient-to-r bg-clip-text text-transparent",
              theme.labelColor
            )}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
};
