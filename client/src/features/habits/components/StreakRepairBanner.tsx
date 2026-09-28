import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { ApiError } from "../../../services/api";
import { useDialog } from "../../../shared/hooks/useDialog";
import { formatDateLabel, formatShortDateLabel } from "../../../shared/lib/date";
import { playSound } from "../../../shared/lib/sounds";
import { cn } from "../../../shared/lib/utils";
import type { StreakRepairOffer } from "../../../shared/types/habit";
import { useGameProfile } from "../../gamification/hooks/useGameProfile";
import { useRepairStreak } from "../hooks/useHabits";

const friendlyError = (error: unknown, gemCost: number) => {
  if (error instanceof ApiError) {
    if (error.status === 409)
      return "That day was logged in the meantime, so there's nothing to repair.";
    if (error.status === 400)
      return /gem|freeze/i.test(error.message)
        ? `You need a streak freeze or ${gemCost} gems to repair this streak.`
        : "This day can't be repaired any more.";
    if (error.status === 404) return "This habit no longer exists.";
  }
  return error instanceof Error && error.message
    ? error.message
    : "Could not repair the streak. Please try again.";
};

/**
 * Compact "streak broken" notice with a confirm dialog that spends one streak
 * freeze (or gems when none are left) to excuse the missed day.
 */
export const StreakRepairBanner = ({
  habitId,
  habitTitle,
  offer,
  className
}: {
  habitId: string;
  habitTitle: string;
  offer: StreakRepairOffer;
  className?: string;
}) => {
  const { data: profile } = useGameProfile();
  const repair = useRepairStreak();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freezes = profile?.streakFreezes ?? 0;
  const gems = profile?.gems ?? 0;
  const known = profile != null;
  const useFreeze = !known || freezes >= offer.freezeCost;
  const affordable = !known || useFreeze || gems >= offer.gemCost;
  const costLabel = useFreeze
    ? `🛡️${offer.freezeCost}`
    : `💎${offer.gemCost}`;
  const costWords = useFreeze
    ? `${offer.freezeCost} streak freeze`
    : `${offer.gemCost} gems`;

  const close = useCallback(() => {
    if (!repair.isPending) setOpen(false);
  }, [repair.isPending]);
  const selector = `[data-streak-repair-dialog="${habitId}"]`;
  useDialog(open, close, selector);

  const confirm = async () => {
    setError(null);
    try {
      await repair.mutateAsync({
        habitId,
        date: offer.date,
        gemCost: offer.gemCost
      });
      playSound("restore");
      setOpen(false);
    } catch (err) {
      setError(friendlyError(err, offer.gemCost));
    }
  };

  const titleId = `streak-repair-title-${habitId}`;
  const descId = `streak-repair-desc-${habitId}`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs",
        className
      )}
    >
      <p className="font-semibold text-cyan-800 dark:text-cyan-200">
        <span aria-hidden>❄️ </span>Streak broken on{" "}
        {formatShortDateLabel(offer.date)}
      </p>
      {affordable ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          aria-label={`Repair streak for ${habitTitle} for ${costWords}`}
          className="min-h-9 rounded-lg bg-cyan-600 px-3 font-bold text-white transition hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 active:scale-95"
        >
          Repair for {costLabel}
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-9 cursor-not-allowed rounded-lg border border-border-app px-3 font-bold text-content-muted opacity-80"
        >
          Need 💎{offer.gemCost} (you have {gems})
        </button>
      )}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={close}
          >
            <section
              data-streak-repair-dialog={habitId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descId}
              className="relative w-full max-w-sm rounded-3xl border border-border-app bg-surface p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close dialog"
                onClick={close}
                disabled={repair.isPending}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-content-muted hover:bg-surface-2"
              >
                <X size={20} aria-hidden />
              </button>
              <p className="text-4xl" aria-hidden>
                ❄️
              </p>
              <h2
                id={titleId}
                className="mt-3 pr-8 font-display text-xl font-bold text-content"
              >
                Repair your streak?
              </h2>
              <p
                id={descId}
                className="mt-2 text-sm leading-relaxed text-content-2"
              >
                You missed <strong>{habitTitle}</strong> on{" "}
                {formatDateLabel(offer.date)}. Repairing marks that day as
                frozen so your streak keeps going. This uses{" "}
                <strong>{costWords}</strong>
                {known
                  ? useFreeze
                    ? ` (you have ${freezes}).`
                    : ` (you have ${gems}).`
                  : "."}
              </p>
              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400"
                >
                  {error}
                </p>
              )}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={repair.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void confirm()}
                  disabled={repair.isPending}
                >
                  {repair.isPending ? "Repairing…" : `Repair for ${costLabel}`}
                </Button>
              </div>
            </section>
          </div>,
          document.body
        )}
    </div>
  );
};
