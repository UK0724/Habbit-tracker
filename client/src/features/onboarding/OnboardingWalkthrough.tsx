import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PencilLine,
  Sparkles
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { StreakFlame } from "../../components/viz/StreakFlame";
import { useDialog } from "../../shared/hooks/useDialog";
import { useReducedMotion } from "../../shared/hooks/useReducedMotion";
import { getTodayDateString } from "../../shared/lib/date";
import { cn } from "../../shared/lib/utils";
import { useAuthStore } from "../../stores/authStore";
import { useRewardStore } from "../gamification/rewards";
import { useCreateHabit } from "../habits/hooks/useHabits";
import { getHabits } from "../habits/services/habitsApi";
import { useCreateHabitModalStore } from "../habits/stores/createHabitModalStore";
import {
  ONBOARDING_STEP_COUNT,
  STARTER_HABITS,
  cachedLoginStreak,
  celebrateHabitCreated,
  hasSeenOnboarding,
  markOnboardingSeen,
  useOnboardingStore,
  type StarterHabit
} from "./onboardingStore";

const DIALOG_SELECTOR = "[data-onboarding-dialog]";
const TITLE_ID = "onboarding-step-title";
const DESCRIPTION_ID = "onboarding-step-description";
/** Any other open modal (reward celebrations, create habit, expenses…). */
const OTHER_DIALOG_SELECTOR =
  '[role="dialog"][aria-modal="true"]:not([data-onboarding-dialog]), [role="alertdialog"]';

const StepHeading = ({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) => (
  <div className="text-center">
    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">
      {eyebrow}
    </p>
    <h2
      id={TITLE_ID}
      className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-content sm:text-[1.7rem]"
    >
      {title}
    </h2>
    <p
      id={DESCRIPTION_ID}
      className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-content-muted"
    >
      {children}
    </p>
  </div>
);

const FactRow = ({ icon, children }: { icon: string; children: ReactNode }) => (
  <li className="flex items-start gap-3 rounded-2xl border border-border-app bg-surface-2 px-3.5 py-3 text-left text-sm leading-snug text-content-2">
    <span aria-hidden className="mt-px shrink-0 text-lg leading-none">
      {icon}
    </span>
    <span className="min-w-0">{children}</span>
  </li>
);

const WelcomeStep = ({ reducedMotion }: { reducedMotion: boolean }) => (
  <div className="space-y-6">
    <div className="relative mx-auto flex w-full max-w-xs items-center gap-3 rounded-2xl border border-border-app bg-surface-2 p-3.5 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-xl">
        <span aria-hidden>💧</span>
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-bold text-content">Drink water</p>
        <p className="text-xs text-content-muted">Every day</p>
      </div>
      <motion.span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-md shadow-emerald-500/30"
        initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 420, damping: 18 }}
      >
        ✓
      </motion.span>
    </div>
    <StepHeading eyebrow="Step 1 · Welcome" title="Welcome to Pulse">
      Build habits that stick — one tap a day. Pick a few small routines, tick
      them off as you go, and watch your progress add up.
    </StepHeading>
  </div>
);

const XpStep = ({ reducedMotion }: { reducedMotion: boolean }) => (
  <div className="space-y-5">
    <div className="mx-auto w-full max-w-xs rounded-2xl border border-border-app bg-surface-2 p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Lv.1
        </span>
        <motion.span
          className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600 dark:text-emerald-400"
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          +10 XP
        </motion.span>
      </div>
      <div
        aria-hidden
        className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-surface-3 shadow-inner"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-fuchsia-500"
          initial={reducedMotion ? false : { width: "18%" }}
          animate={{ width: "72%" }}
          transition={{ delay: 0.2, duration: 0.9, ease: "easeOut" }}
        />
      </div>
      <div className="mt-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          <span aria-hidden>🥉</span> First Step · +1 💎
        </span>
      </div>
    </div>
    <StepHeading eyebrow="Step 2 · Rewards" title="Earn XP & level up">
      Every check-in earns XP. Fill the bar to level up and unlock badges along
      the way.
    </StepHeading>
    <ul className="grid gap-2">
      <FactRow icon="⚡">
        <strong className="text-content">+10 XP</strong> for each action habit,{" "}
        <strong className="text-content">+5–15 XP</strong> for measurable ones.
      </FactRow>
      <FactRow icon="👑">
        <strong className="text-content">+25 XP Legendary Day</strong> when every
        habit due today is done.
      </FactRow>
      <FactRow icon="🏅">
        Badges add bonus XP and 💎 gems (bronze 1 · silver 2 · gold 3 · platinum
        5).
      </FactRow>
    </ul>
  </div>
);

const StreakStep = ({ reducedMotion }: { reducedMotion: boolean }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-center gap-3">
      <motion.div
        initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
      >
        <StreakFlame count={1} size={52} />
      </motion.div>
      <div className="text-left">
        <p className="font-display text-3xl font-black leading-none text-amber-500">
          Day 1
        </p>
        <p className="mt-1 text-xs font-semibold text-content-muted">
          …and counting
        </p>
      </div>
    </div>
    <StepHeading eyebrow="Step 3 · Streaks" title="Protect your streak 🔥">
      Your streak starts the day you create your first habit. Check in every day
      to keep it growing.
    </StepHeading>
    <ul className="grid gap-2">
      <FactRow icon="🛡️">
        <strong className="text-content">Streak freeze</strong> — costs 2 💎 and
        automatically covers one missed check-in day.
      </FactRow>
      <FactRow icon="❄️">
        <strong className="text-content">Streak repair</strong> — missed a habit?
        Fix its broken streak within 2 days for 1 freeze or 3 💎.
      </FactRow>
      <FactRow icon="💎">
        Earn gems from badges and streak milestones.
      </FactRow>
    </ul>
  </div>
);

type CreateStepProps = {
  pendingId: string | null;
  error: string | null;
  onStarter: (starter: StarterHabit) => void;
  onCustom: () => void;
};

const CreateStep = ({ pendingId, error, onStarter, onCustom }: CreateStepProps) => (
  <div className="space-y-5">
    <StepHeading eyebrow="Step 4 · Let's go" title="Create your first habit">
      Start small — tap a starter to add it now, or make your own. You can edit
      it any time.
    </StepHeading>
    <div className="grid gap-2.5" role="group" aria-label="Starter habits">
      {STARTER_HABITS.map((starter) => {
        const pending = pendingId === starter.id;
        const busy = pendingId !== null;
        return (
          <button
            key={starter.id}
            type="button"
            // aria-disabled keeps focus on the button while it saves.
            aria-disabled={busy || undefined}
            aria-busy={pending || undefined}
            onClick={() => onStarter(starter)}
            className={cn(
              "group flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border-app bg-surface-2 px-3.5 py-3 text-left transition",
              "hover:border-accent hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30",
              busy && !pending && "opacity-50",
              busy ? "cursor-wait" : "cursor-pointer active:scale-[0.99]"
            )}
          >
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-xl shadow-sm"
            >
              {starter.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-content">
                {starter.title}
              </span>
              <span className="block text-xs text-content-muted">
                {starter.hint}
              </span>
            </span>
            <span className="shrink-0 text-xs font-bold text-accent">
              {pending ? (
                <span className="inline-flex items-center gap-1">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  Adding…
                </span>
              ) : (
                <span className="transition-transform group-hover:translate-x-0.5">
                  Add
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
    <Button
      type="button"
      variant="secondary"
      aria-disabled={pendingId !== null || undefined}
      onClick={onCustom}
      className={cn("w-full font-bold", pendingId !== null && "opacity-60")}
    >
      <PencilLine className="mr-2 h-4 w-4" aria-hidden />
      Create my own
    </Button>
    {error ? (
      <p
        role="alert"
        className="rounded-xl bg-rose-500/10 px-3 py-2 text-center text-sm font-medium text-rose-600 dark:text-rose-400"
      >
        {error}
      </p>
    ) : null}
  </div>
);

/**
 * First-run walkthrough. Opens once per account (while the account has no
 * habits) and can be replayed from Settings or the account menu. It pauses
 * while a reward celebration or the create-habit dialog is on screen so only
 * one modal owns focus and scrolling at a time.
 */
export const OnboardingWalkthrough = () => {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isOpen = useOnboardingStore((s) => s.isOpen);
  const step = useOnboardingStore((s) => s.step);
  const openWalkthrough = useOnboardingStore((s) => s.open);
  const closeWalkthrough = useOnboardingStore((s) => s.close);
  const setStep = useOnboardingStore((s) => s.setStep);
  const rewardActive = useRewardStore((s) =>
    Boolean(s.streakLost || s.levelUp || s.achievements.length || s.legendary)
  );
  const createOpen = useCreateHabitModalStore((s) => s.isOpen);
  const openCreateHabit = useCreateHabitModalStore((s) => s.open);
  const queryClient = useQueryClient();
  const createHabit = useCreateHabit();
  const reducedMotion = useReducedMotion();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const regionRef = useRef<HTMLDivElement>(null);
  const autoOpenedFor = useRef<string | null>(null);
  const lastStep = useRef<number | null>(null);

  const seen = userId ? hasSeenOnboarding(userId) : true;
  const today = getTodayDateString();
  // Same key as the habits page, so this shares its cache and request.
  // Returning users (already seen) do not fetch anything extra.
  const habitsQuery = useQuery({
    queryKey: ["habits", today],
    queryFn: () => getHabits(today),
    enabled: Boolean(userId) && !seen && !isOpen
  });
  const hasNoHabits = habitsQuery.isSuccess && habitsQuery.data.length === 0;

  const visible = isOpen && Boolean(userId) && !rewardActive && !createOpen;
  const busy = pendingId !== null;

  // First run: open once the habits list confirms there is nothing yet and no
  // other dialog is showing (a celebration may still be closing).
  useEffect(() => {
    if (!userId || seen || isOpen || !hasNoHabits) return;
    if (rewardActive || createOpen || autoOpenedFor.current === userId) return;
    let timer = 0;
    const tryOpen = () => {
      if (document.querySelector(OTHER_DIALOG_SELECTOR)) {
        timer = window.setTimeout(tryOpen, 800);
        return;
      }
      autoOpenedFor.current = userId;
      openWalkthrough(0);
    };
    timer = window.setTimeout(tryOpen, 450);
    return () => window.clearTimeout(timer);
  }, [userId, seen, isOpen, hasNoHabits, rewardActive, createOpen, openWalkthrough]);

  // Never carry an open walkthrough over to the next account on this device.
  useEffect(() => () => useOnboardingStore.getState().close(), []);
  useEffect(() => {
    if (!userId) closeWalkthrough();
  }, [userId, closeWalkthrough]);

  // Fresh state each time it opens.
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setDirection(1);
  }, [isOpen]);

  const finish = useCallback(() => {
    if (userId) markOnboardingSeen(userId);
    closeWalkthrough();
  }, [userId, closeWalkthrough]);

  /** Skip / Escape. Ignored while a starter habit is being saved. */
  const skip = useCallback(() => {
    if (busy) return;
    finish();
  }, [busy, finish]);

  useDialog(visible, skip, DIALOG_SELECTOR);

  // Keep focus inside the dialog when the focused button disappears between
  // steps (e.g. "Next" on the last step) and let screen readers hear the step.
  useEffect(() => {
    if (!visible) {
      lastStep.current = null;
      return;
    }
    if (lastStep.current !== null && lastStep.current !== step) {
      regionRef.current?.focus({ preventScroll: true });
    }
    lastStep.current = step;
  }, [step, visible]);

  const goTo = (next: number) => {
    if (busy) return;
    setDirection(next > step ? 1 : -1);
    setError(null);
    setStep(next);
  };

  const handleStarter = async (starter: StarterHabit) => {
    if (busy) return;
    const streakBefore = cachedLoginStreak(queryClient);
    setPendingId(starter.id);
    setError(null);
    try {
      // Resolves after the habits list and game profile have been refreshed.
      await createHabit.mutateAsync(starter.input);
      finish();
      celebrateHabitCreated(queryClient, streakBefore);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not create the habit. Please try again."
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleCustom = () => {
    if (busy) return;
    const streakBefore = cachedLoginStreak(queryClient);
    finish();
    openCreateHabit(undefined, {
      onSuccess: () => celebrateHabitCreated(queryClient, streakBefore)
    });
  };

  if (!visible) return null;

  const isLast = step === ONBOARDING_STEP_COUNT - 1;
  const offset = reducedMotion ? 0 : 28;

  return createPortal(
    <div
      // A stray tap outside should not dismiss a one-time walkthrough; Skip
      // and Escape do that explicitly.
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 p-3 backdrop-blur-sm animate-fade-in sm:p-4"
    >
      <motion.div
        data-onboarding-dialog
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Pulse"
        aria-describedby={DESCRIPTION_ID}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { type: "spring", stiffness: 360, damping: 28 }
        }
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border-app bg-surface text-content shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
        />

        {/* Progress + skip */}
        <div className="relative flex shrink-0 items-center gap-3 px-5 pb-2 pt-4 sm:px-6">
          <div className="flex flex-1 items-center gap-1.5" aria-hidden>
            {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-accent" : "bg-surface-3"
                )}
              />
            ))}
          </div>
          <p className="shrink-0 text-xs font-semibold text-content-muted">
            Step {step + 1} of {ONBOARDING_STEP_COUNT}
          </p>
          <button
            type="button"
            onClick={skip}
            aria-disabled={busy || undefined}
            className="-mr-2 min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold text-content-muted transition hover:bg-surface-2 hover:text-content focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30"
          >
            Skip
          </button>
        </div>

        {/* Step content */}
        <div
          ref={regionRef}
          tabIndex={-1}
          role="group"
          aria-roledescription="step"
          aria-labelledby={TITLE_ID}
          className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-2 pt-3 outline-none sm:px-6"
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * offset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * offset }}
              transition={{ duration: reducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
              className="min-h-[18rem]"
            >
              {step === 0 && <WelcomeStep reducedMotion={reducedMotion} />}
              {step === 1 && <XpStep reducedMotion={reducedMotion} />}
              {step === 2 && <StreakStep reducedMotion={reducedMotion} />}
              {step === 3 && (
                <CreateStep
                  pendingId={pendingId}
                  error={error}
                  onStarter={(starter) => void handleStarter(starter)}
                  onCustom={handleCustom}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="relative flex shrink-0 items-center justify-between gap-3 border-t border-border-app px-5 py-3.5 sm:px-6">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              aria-disabled={busy || undefined}
              onClick={() => goTo(step - 1)}
              className="font-bold"
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              Back
            </Button>
          ) : (
            <span />
          )}
          {!isLast ? (
            <Button
              type="button"
              onClick={() => goTo(step + 1)}
              className="font-bold shadow-md shadow-accent/20"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <p className="text-xs font-medium text-content-muted">
              Pick one to start your streak 🔥
            </p>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
