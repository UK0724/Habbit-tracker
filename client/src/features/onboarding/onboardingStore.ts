import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";

import {
  GAME_PROFILE_QUERY_KEY,
  type GameProfile
} from "../gamification/hooks/useGameProfile";

import type { CreateHabitInput } from "../../shared/types/habit";
import { playSound } from "../../shared/lib/sounds";
import { pushToast } from "../../stores/xpToastStore";

export const ONBOARDING_STEP_COUNT = 4;

const storageKeyFor = (userId: string) => `pulse-onboarding-seen:${userId}`;

/**
 * Accounts that finished or skipped the walkthrough during this page session.
 * This is the fallback when localStorage is unavailable (private mode, blocked
 * site data): the walkthrough is then shown at most once per session.
 */
const seenThisSession = new Set<string>();

export const hasSeenOnboarding = (userId: string) => {
  if (seenThisSession.has(userId)) return true;
  try {
    return localStorage.getItem(storageKeyFor(userId)) === "1";
  } catch {
    return false;
  }
};

export const markOnboardingSeen = (userId: string) => {
  seenThisSession.add(userId);
  try {
    localStorage.setItem(storageKeyFor(userId), "1");
  } catch {
    // Storage unavailable: the in-memory flag still covers this session.
  }
};

type OnboardingState = {
  isOpen: boolean;
  step: number;
  /** Opens the walkthrough (from the first step unless told otherwise). */
  open: (step?: number) => void;
  close: () => void;
  setStep: (step: number) => void;
};

const clampStep = (step: number) =>
  Math.min(ONBOARDING_STEP_COUNT - 1, Math.max(0, Math.trunc(step) || 0));

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isOpen: false,
  step: 0,
  open: (step = 0) => set({ isOpen: true, step: clampStep(step) }),
  close: () => set({ isOpen: false }),
  setStep: (step) => set({ step: clampStep(step) })
}));

export type StarterHabit = {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  input: CreateHabitInput;
};

/** One-tap starters offered on the last walkthrough step. */
export const STARTER_HABITS: StarterHabit[] = [
  {
    id: "water",
    emoji: "💧",
    title: "Drink water",
    hint: "Tick it off · every day",
    input: {
      title: "Drink water",
      type: "action",
      color: "blue",
      schedule: "daily",
      requireCompletionComment: false
    }
  },
  {
    id: "read",
    emoji: "📖",
    title: "Read 10 pages",
    hint: "Target 10 pages · every day",
    input: {
      title: "Read 10 pages",
      type: "measurable",
      unit: "pages",
      target: 10,
      goalDirection: "up",
      color: "amber",
      schedule: "daily",
      requireCompletionComment: false
    }
  },
  {
    id: "walk",
    emoji: "🚶",
    title: "Walk 20 minutes",
    hint: "Tick it off · every day",
    input: {
      title: "Walk 20 minutes",
      type: "action",
      color: "emerald",
      schedule: "daily",
      requireCompletionComment: false
    }
  }
];

/** Current login streak from the cached game profile (0 when unknown). */
export const cachedLoginStreak = (queryClient: QueryClient) =>
  queryClient.getQueryData<GameProfile>(GAME_PROFILE_QUERY_KEY)?.loginStreak ??
  0;

/**
 * Feedback after a habit is created from onboarding or the empty state. The
 * server starts the streak (Day 1) only when the very first habit is created,
 * so that is claimed only when the refreshed profile shows it happened.
 * Call after the create mutation resolved (it refreshes the profile first).
 */
export const celebrateHabitCreated = (
  queryClient: QueryClient,
  streakBefore: number
) => {
  const streakStarted =
    streakBefore === 0 && cachedLoginStreak(queryClient) > 0;
  playSound("streak");
  pushToast({
    amount: 0,
    label: "",
    title: streakStarted
      ? "Day 1 🔥 — your streak has started"
      : "Habit created ✨",
    tone: "gain"
  });
};
