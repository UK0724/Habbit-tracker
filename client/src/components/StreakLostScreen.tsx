import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Shield, RotateCcw } from "lucide-react";
import { playSound } from "../shared/lib/sounds";
import { useDialog } from "../shared/hooks/useDialog";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";
import { Button } from "./ui/Button";
import {
  useGameProfile,
  useRestoreStreak,
  useStreakFreeze
} from "../features/gamification/hooks/useGameProfile";
import type { CheckinResult } from "../features/gamification/rewards";

export interface StreakLostScreenProps {
  isOpen: boolean;
  onClose: () => void;
  result: CheckinResult | null;
}

const DEFAULT_RESTORE_COST = 5;
const FREEZE_COST = 2;

const formatTimeLeft = (expiresAt: string | null | undefined, now: number) => {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const minutes = Math.ceil(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min left`;
  return rest ? `${hours}h ${rest}m left` : `${hours}h left`;
};

export const StreakLostScreen = ({
  isOpen,
  onClose,
  result
}: StreakLostScreenProps) => {
  const { data: profile } = useGameProfile();
  const restore = useRestoreStreak();
  const freeze = useStreakFreeze();
  const reducedMotion = useReducedMotion();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pending = restore.isPending || freeze.isPending;

  useDialog(isOpen, onClose, "[data-streak-lost-dialog]");

  useEffect(() => {
    if (!isOpen) return;
    playSound("streakbreak");
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const previousStreak =
    result?.previousStreak ?? profile?.brokenStreak?.previousStreak ?? 0;
  const restoreCost = result?.restoreCost ?? DEFAULT_RESTORE_COST;
  const expiresAt =
    result?.restoreExpiresAt ?? profile?.brokenStreak?.restoreExpiresAt ?? null;
  const timeLeft = formatTimeLeft(expiresAt, now);
  const canRestore = Boolean(result?.canRestore) && (expiresAt == null || timeLeft !== null);
  const gems = profile?.gems ?? 0;
  const enoughGems = gems >= restoreCost;
  const freezes = profile?.streakFreezes ?? 0;

  const handleRestore = async () => {
    setMessage(null);
    try {
      const data = await restore.mutateAsync();
      playSound("restore");
      setMessage({
        tone: "ok",
        text: `Streak restored — you're on day ${data.streak}. 🔥`
      });
      window.setTimeout(onClose, 1400);
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not restore your streak. Try again."
      });
    }
  };

  const handleBuyFreeze = async () => {
    setMessage(null);
    try {
      await freeze.mutateAsync();
      setMessage({
        tone: "ok",
        text: "Streak freeze bought. It will cover your next missed day."
      });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not buy a streak freeze."
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={() => !pending && onClose()}
    >
      <motion.div
        data-streak-lost-dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-lost-title"
        aria-describedby="streak-lost-description"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 30 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { type: "spring", stiffness: 320, damping: 25 }
        }
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-rose-500/40 bg-gradient-to-b from-surface via-surface-2 to-surface p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.35)]"
      >
        <div className="text-center">
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
            <Flame className="h-10 w-10 stroke-[2.5]" aria-hidden />
          </div>

          <h2
            id="streak-lost-title"
            className="font-display text-2xl sm:text-3xl font-black text-content tracking-tight"
          >
            {previousStreak > 0
              ? `Your ${previousStreak}-day streak ended`
              : "Your streak ended"}
          </h2>
          <p id="streak-lost-description" className="mt-2 text-sm text-content-2">
            {canRestore
              ? "You missed a day. You can bring your streak back, or start a new one today."
              : "You missed a day. Check in today to start a new streak."}
          </p>
        </div>

        {message && (
          <div
            role={message.tone === "error" ? "alert" : "status"}
            className={
              message.tone === "error"
                ? "mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-center text-sm font-semibold text-rose-600"
                : "mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-center text-sm font-semibold text-emerald-600"
            }
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {canRestore ? (
            <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-4">
              <Button
                type="button"
                className="w-full font-bold"
                disabled={!enoughGems || pending}
                onClick={() => void handleRestore()}
              >
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                {restore.isPending
                  ? "Restoring…"
                  : enoughGems
                    ? `Restore for ${restoreCost} 💎`
                    : `Need ${restoreCost} 💎 (you have ${gems})`}
              </Button>
              <p className="mt-2 text-center text-xs text-content-muted">
                Brings back your {previousStreak > 0 ? `${previousStreak}-day ` : ""}
                streak and counts today.
                {timeLeft ? ` ${timeLeft} to restore.` : ""}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-content">Streak freezes</p>
                <p className="mt-0.5 text-xs text-content-2">
                  A streak freeze covers one missed day — buy one in advance for{" "}
                  {FREEZE_COST} 💎. You have {freezes}{" "}
                  {freezes === 1 ? "freeze" : "freezes"} and {gems}{" "}
                  {gems === 1 ? "gem" : "gems"}.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3 text-xs font-bold"
                  disabled={gems < FREEZE_COST || pending}
                  onClick={() => void handleBuyFreeze()}
                >
                  {freeze.isPending
                    ? "Buying…"
                    : gems < FREEZE_COST
                      ? `Need ${FREEZE_COST} 💎 for a freeze`
                      : `Buy a freeze for ${FREEZE_COST} 💎`}
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full py-3 text-sm font-semibold"
            disabled={pending}
            onClick={onClose}
          >
            Start fresh
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
