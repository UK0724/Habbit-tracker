import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "../../shared/lib/utils";

export interface GemCounterProps {
  gems: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export const GemCounter = ({
  gems,
  size = "md",
  onClick,
  className
}: GemCounterProps) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
    lg: "px-3.5 py-1.5 text-base gap-2"
  }[size];

  const sparkleSize = {
    sm: 11,
    md: 13,
    lg: 16
  }[size];

  return (
    <motion.button
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={!onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      className={cn(
        "relative inline-flex items-center rounded-full border border-sky-400/40 bg-gradient-to-r from-sky-500/10 via-cyan-500/15 to-blue-500/10 font-bold text-sky-400 shadow-sm transition-all select-none overflow-hidden",
        onClick && "cursor-pointer hover:border-sky-400 hover:shadow-[0_0_12px_rgba(56,189,248,0.4)]",
        sizeClasses,
        className
      )}
    >
      {/* Sparkle background pulse */}
      <motion.div
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-r from-sky-400/10 via-cyan-300/20 to-blue-400/10 pointer-events-none"
      />

      <div className="relative flex items-center justify-center">
        <span className="text-base leading-none">💎</span>
        <motion.div
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
            rotate: [0, 90, 180]
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            repeatDelay: 1.5,
            ease: "easeInOut"
          }}
          className="absolute -top-1 -right-1 text-cyan-200 pointer-events-none"
        >
          <Sparkles size={sparkleSize} />
        </motion.div>
      </div>

      <span className="relative z-10 font-extrabold text-cyan-300">
        {gems.toLocaleString()}
      </span>
    </motion.button>
  );
};
