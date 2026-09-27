import { useEffect,useState,useId } from "react";
import { createPortal } from "react-dom";
import { motion,AnimatePresence } from "framer-motion";
import {
Sparkles,
Trophy,
X,
Lock,
Volume2,
VolumeX,
ExternalLink,
ShieldCheck,
Flame,
CheckCircle2
} from "lucide-react";
import { useMockAdStore } from "../stores/mockAdStore";
import type { AdRequest } from "../providers/AdProvider";

export interface MockAdModalProps {
  isOpen?: boolean;
  request?: AdRequest | null;
  durationSeconds?: number;
  onComplete?: (token: string) => void;
  onSkip?: () => void;
  onClose?: () => void;
}

export const MockAdModal = ({
  isOpen: propsIsOpen,
  request: propsRequest,
  durationSeconds = 5,
  onComplete: propsOnComplete,
  onSkip: propsOnSkip,
  onClose: propsOnClose
}: MockAdModalProps) => {
  const storeIsOpen = useMockAdStore((s) => s.isOpen);
  const storeRequest = useMockAdStore((s) => s.request);
  const storeDuration = useMockAdStore((s) => s.duration);
  const storeCompleteAd = useMockAdStore((s) => s.completeAd);
  const storeSkipAd = useMockAdStore((s) => s.skipAd);
  const setRegistered = useMockAdStore((s) => s.setRegistered);

  // Controlled vs Store
  const isControlled = typeof propsIsOpen === "boolean";
  const isOpen = isControlled ? propsIsOpen : storeIsOpen;
  const request = isControlled ? propsRequest : storeRequest;
  const initialDuration = isControlled
    ? durationSeconds
    : (storeDuration ?? durationSeconds);

  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [demoClicked, setDemoClicked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  // Register in store that a modal is active in React tree
  useEffect(() => {
    setMounted(true);
    setRegistered(true);
    return () => {
      setRegistered(false);
    };
  }, [setRegistered]);

  // Countdown timer logic
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(initialDuration);
      setIsCompleted(false);
      setDemoClicked(false);
      return;
    }

    setTimeLeft(initialDuration);
    setIsCompleted(false);
    setDemoClicked(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, initialDuration]);

  // Handle completion claim
  const handleClaim = () => {
    if (!isCompleted) return;
    if (isControlled) {
      if (request?.serverToken) {
        propsOnComplete?.(request.serverToken);
      }
    } else {
      storeCompleteAd();
    }
  };

  // Handle Skip/Close
  const handleSkipOrClose = () => {
    if (!isCompleted) return; // User cannot skip until 5 seconds

    if (isControlled) {
      if (request?.serverToken) {
        propsOnComplete?.(request.serverToken);
      } else {
        propsOnSkip?.();
      }
      propsOnClose?.();
    } else {
      storeSkipAd(true); // Resolves as completed since 5s requirement was met
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md"
        >
          {/* Main Ad Card Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="relative flex flex-col w-full max-w-xl max-h-[92vh] overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl text-zinc-100"
          >
            {/* Top Progress Bar */}
            <div className="h-1.5 w-full bg-zinc-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500"
                initial={{ width: "0%" }}
                animate={{
                  width: isCompleted
                    ? "100%"
                    : `${((initialDuration - timeLeft) / initialDuration) * 100}%`
                }}
                transition={{ duration: 0.95, ease: "linear" }}
              />
            </div>

            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-zinc-800/80 bg-zinc-900/60">
              {/* Left: Sponsored Badge */}
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                  Ad · Sponsored
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Partner
                </span>
              </div>

              {/* Center: Countdown Timer Badge */}
              <div className="flex items-center">
                <AnimatePresence mode="wait">
                  {!isCompleted ? (
                    <motion.div
                      key="countdown"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1.5 rounded-full bg-zinc-800/90 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30 shadow-inner"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                      <span>Reward in {timeLeft}...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="completed"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Reward Ready!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Close/Skip Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
                  aria-label={isMuted ? "Unmute sound" : "Mute sound"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Skip / Close Button with 5-second Lockout */}
                {!isCompleted ? (
                  <button
                    type="button"
                    disabled
                    aria-label={`Skip locked for ${timeLeft} seconds`}
                    className="flex items-center gap-1 rounded-full bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-500 cursor-not-allowed border border-zinc-700/40 select-none"
                  >
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <span>Skip in {timeLeft}s</span>
                  </button>
                ) : (
                  <motion.button
                    type="button"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleSkipOrClose}
                    className="flex items-center gap-1 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 hover:text-white transition border border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    aria-label="Skip ad and collect reward"
                  >
                    <span>Close</span>
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Ad Banner Body Placeholder */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Simulated Game / App Showcase Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-zinc-950 border border-indigo-900/50 p-6 sm:p-8 text-center shadow-lg">
                {/* Background ambient glow */}
                <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-10 w-52 h-52 rounded-full bg-purple-500/20 blur-3xl" />

                {/* App Crest / Icon */}
                <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 shadow-xl ring-4 ring-indigo-500/20">
                  <Flame className="w-10 h-10 text-white fill-white drop-shadow-md animate-pulse" />
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-900/60 px-3 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-700/50 mb-2">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Featured Game of the Month</span>
                </div>

                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display"
                >
                  Realm of Streaks: Epic Quest
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Turn daily habits into legendary battles! Defeat procrastination
                  bosses, collect mystical runes, and conquer the guild leaderboard.
                </p>

                {/* Ratings & Stat Badges */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400">★★★★★</span>
                    <span className="font-semibold text-zinc-200">4.9</span>
                  </div>
                  <span>•</span>
                  <span>500K+ Downloads</span>
                  <span>•</span>
                  <span>Free to Play</span>
                </div>

                {/* Interactive Demo CTA */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDemoClicked(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition"
                  >
                    <span>{demoClicked ? "✓ Interactive Demo Active" : "Play Interactive Preview"}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Banner based on countdown */}
              <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {isCompleted ? (
                        <Trophy className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Flame className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {isCompleted
                          ? "Streak Restoration Ready!"
                          : "Watch 5 seconds to unlock your reward"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {isCompleted
                          ? "Your server token is verified. Click below to restore your streak."
                          : "Do not close the modal until the countdown completes."}
                      </p>
                    </div>
                  </div>

                  {/* Completion Action */}
                  {isCompleted && (
                    <motion.button
                      type="button"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleClaim}
                      className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-400 hover:to-teal-500 transition"
                    >
                      Restore Streak 🔥
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="px-4 py-2.5 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Simulated Rewarded Ad Overlay</span>
              <span>Habit Tracker Gamification Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
