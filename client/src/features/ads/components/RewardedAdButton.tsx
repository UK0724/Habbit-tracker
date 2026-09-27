import { useState } from "react";
import { motion,AnimatePresence } from "framer-motion";
import { Loader2,Flame,CheckCircle,AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useRewardedAd } from "../hooks/useRewardedAd";
import { MockAdModal } from "./MockAdModal";
import { cn } from "../../../shared/lib/utils";

export interface RewardedAdButtonProps {
  onSuccess?: (streak: number) => void;
  onError?: (error: Error) => void;
  onSkipped?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "accent";
}

const sizeClasses = {
  sm: "h-9 px-3.5 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5"
} as const;

export const RewardedAdButton = ({
  onSuccess,
  onError,
  onSkipped,
  className,
  disabled = false,
  children,
  size = "md",
  variant = "accent"
}: RewardedAdButtonProps) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { watchAd, isLoading, error } = useRewardedAd({
    onSuccess: (data) => {
      // Trigger game-like celebration particles
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.65 }
        });
      } catch {
        // Fallback silently if canvas-confetti cannot find canvas
      }

      setSuccessMessage(`Streak restored to ${data.streak} days! 🔥`);
      setTimeout(() => setSuccessMessage(null), 5000);
      onSuccess?.(data.streak);
    },
    onError: (err) => {
      onError?.(err);
    },
    onSkipped
  });

  const handleClick = async () => {
    if (isLoading || disabled) return;
    await watchAd();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-accent text-accent-fg hover:bg-accent-hover shadow-md shadow-accent/20 border border-accent/30";
      case "secondary":
        return "bg-surface-3 text-content hover:bg-surface-2 border border-border-app";
      case "accent":
      default:
        return "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 border border-amber-400/40";
    }
  };

  if (import.meta.env.PROD) return null;

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <motion.button
        type="button"
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center rounded-2xl font-semibold transition select-none",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/40",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
          sizeClasses[size],
          getVariantStyles(),
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Loading Ad...</span>
          </>
        ) : (
          children ?? (
            <>
              <span className="text-base leading-none">📺</span>
              <span>Watch Ad to Restore Streak</span>
              <Flame className="w-4 h-4 text-amber-200 fill-amber-200 ml-0.5" />
            </>
          )
        )}
      </motion.button>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-500 border border-emerald-500/30 shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner if ad failed */}
      <AnimatePresence>
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-400 border border-rose-500/30 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error.message || "Failed to load rewarded ad."}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Include MockAdModal so modal is always mounted when this button is used */}
      <MockAdModal />
    </div>
  );
};
