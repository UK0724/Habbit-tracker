import { useEffect,useState } from "react";
import { AnimatePresence,motion } from "framer-motion";
import { Flame,Shield,PlayCircle,ArrowRight,Sparkles } from "lucide-react";
import { playSound } from "../shared/lib/sounds";
import { Button } from "./ui/Button";
import { useRewardedAd } from "../features/ads/hooks/useRewardedAd";
import { useGameProfile,useStreakFreeze } from "../features/gamification/hooks/useGameProfile";

export interface StreakLostScreenProps {
  isOpen: boolean;
  onClose: () => void;
  lostStreak?: number;
}

export const StreakLostScreen = ({
  isOpen,
  onClose,
  lostStreak
}: StreakLostScreenProps) => {
  const { data: profile } = useGameProfile();
  const freezeMutation = useStreakFreeze();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { watchAd, isLoading: isAdLoading } = useRewardedAd({
    onSuccess: () => {
      playSound("restore");
      setStatusMessage("Streak successfully restored! 🔥");
      setTimeout(() => {
        onClose();
      }, 1200);
    },
    onError: (err) => {
      setStatusMessage(err.message || "Failed to restore streak with ad");
    }
  });

  useEffect(() => {
    if (isOpen) {
      playSound("streakbreak");
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const gems = profile?.gems ?? 0;
  const canUseFreeze = gems >= 2;

  const handleUseFreeze = async () => {
    try {
      await freezeMutation.mutateAsync();
      playSound("restore");
      setStatusMessage("Streak freeze purchased for a future missed day.");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not use freeze";
      setStatusMessage(msg);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: "spring", stiffness: 320, damping: 25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-500/40 bg-gradient-to-b from-surface via-surface-2 to-surface p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.4)]"
        >
          {/* Flame icon banner */}
          <div className="text-center">
            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-inner">
              <motion.div
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Flame className="h-10 w-10 stroke-[2.5]" />
              </motion.div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-rose-400">
              Streak In Danger!
            </div>

            <h2 className="mt-3 font-display text-2xl sm:text-3xl font-black text-content tracking-tight">
              Start your next streak
            </h2>
            <p className="mt-2 text-sm text-content-2">
              {lostStreak
                ? `Your ${lostStreak}-day streak was interrupted. Check in today to start again.`
                : "A missed day is a chance to begin again. Freezes protect future missed days."}
            </p>
          </div>

          {statusMessage && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-center text-sm font-semibold text-amber-400">
              {statusMessage}
            </div>
          )}

          {/* 3 Action Options */}
          <div className="mt-6 space-y-3">
            {/* Option 1: Watch Ad */}
            {import.meta.env.DEV && <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isAdLoading}
              onClick={() => void watchAd()}
              className="flex w-full items-center justify-between rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-surface-3 p-4 text-left shadow-md transition hover:border-amber-400 hover:shadow-amber-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-amber-950 font-bold shadow">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-content">Watch Short Ad</p>
                    <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-amber-400">
                      Free Restore
                    </span>
                  </div>
                  <p className="text-xs text-content-muted">
                    {isAdLoading ? "Loading ad..." : "Watch a 5-second sponsor to restore streak"}
                  </p>
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-amber-400" />
            </motion.button>}

            {/* Option 2: Use Streak Freeze */}
            <motion.button
              type="button"
              whileHover={canUseFreeze ? { scale: 1.02 } : undefined}
              whileTap={canUseFreeze ? { scale: 0.98 } : undefined}
              disabled={!canUseFreeze || freezeMutation.isPending}
              onClick={() => void handleUseFreeze()}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                canUseFreeze
                  ? "border-sky-400/50 bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-surface-3 hover:border-sky-400 hover:shadow-md hover:shadow-sky-500/20"
                  : "border-border-app bg-surface-2 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white font-bold shadow">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-content">Buy a Streak Freeze</p>
                    {(profile?.streakFreezes ?? 0) > 0 ? (
                      <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-sky-400">
                        {profile?.streakFreezes} Available
                      </span>
                    ) : (
                      <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-black text-sky-400">
                        Costs 2 💎
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-muted">
                    {freezeMutation.isPending
                      ? "Activating freeze..."
                      : `You have ${gems} gem${gems === 1 ? "" : "s"} and ${profile?.streakFreezes ?? 0} freezes`}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-sky-400" />
            </motion.button>

            {/* Option 3: Continue */}
            <Button
              type="button"
              variant="ghost"
              className="w-full py-3 text-xs sm:text-sm font-semibold text-content-muted hover:text-content"
              onClick={onClose}
            >
              Start fresh from Day 1
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
