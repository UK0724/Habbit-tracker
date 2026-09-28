/**
 * Pure helpers for the first-run walkthrough ("How Pulse works").
 * No runtime imports, so tests/onboarding.check.cjs can load this file directly.
 */

export const WALKTHROUGH_STEP_COUNT = 4;

/** SecureStore keys may only contain letters, digits, ".", "-" and "_". */
export const ONBOARDING_SEEN_KEY_PREFIX = "pulse_walkthrough_seen_v1_";

/** Storage key remembering that this account finished or skipped the walkthrough. */
export const onboardingSeenKey = (userId: string) =>
  `${ONBOARDING_SEEN_KEY_PREFIX}${String(userId).replace(/[^A-Za-z0-9._-]/g, "_")}`;

/** "loading" until storage answered; a failed read counts as "unseen". */
export type SeenStatus = "loading" | "seen" | "unseen";

type HabitLike = { type?: string | null; title?: string | null; archived?: boolean | null };

/**
 * Habits that make an account "not new": any trackable habit, archived ones
 * included. Expense trackers are not habits the walkthrough is about.
 */
export const countTrackableHabits = (habits: readonly HabitLike[] | null | undefined) =>
  Array.isArray(habits) ? habits.filter((habit) => habit && habit.type !== "expense").length : 0;

export type AutoShowInput = {
  userId: string | null | undefined;
  /** The habits list loaded for real (not loading, not placeholder, no error). */
  habitsReady: boolean;
  trackableHabits: number;
  seen: SeenStatus;
  /** Already auto-shown (or dismissed) for this user during this app session. */
  shownThisSession: boolean;
  /** A celebration modal (incl. the streak-lost sheet) is showing or queued. */
  celebrationActive: boolean;
  /** The walkthrough is already open (e.g. replayed from Profile). */
  alreadyOpen: boolean;
  /** Only pop up on the Today screen, never over a form the user is filling. */
  onToday: boolean;
};

/** First-run rule: signed in, zero habits, not seen, nothing else on screen. */
export const shouldAutoShowWalkthrough = (input: AutoShowInput) =>
  Boolean(input.userId) &&
  input.habitsReady &&
  input.trackableHabits === 0 &&
  input.seen === "unseen" &&
  !input.shownThisSession &&
  !input.celebrationActive &&
  !input.alreadyOpen &&
  input.onToday;

/** The walkthrough waits (without losing its step) while a celebration is up. */
export const walkthroughVisible = (requested: boolean, celebrationActive: boolean) =>
  requested && !celebrationActive;

/** Keeps a step index inside the walkthrough (bad scroll offsets never crash). */
export const clampStep = (step: number) =>
  Number.isFinite(step)
    ? Math.min(WALKTHROUGH_STEP_COUNT - 1, Math.max(0, Math.round(step)))
    : 0;

/** Page index from a horizontal scroll offset. */
export const stepFromOffset = (offsetX: number, pageWidth: number) =>
  pageWidth > 0 ? clampStep(offsetX / pageWidth) : 0;

export type HabitTemplate = {
  id: "water" | "read" | "walk";
  emoji: string;
  title: string;
  subtitle: string;
  type: "action" | "measurable";
  color: string;
  unit?: string;
  target?: number;
};

export const HABIT_TEMPLATES: readonly HabitTemplate[] = [
  {
    id: "water",
    emoji: "💧",
    title: "Drink water",
    subtitle: "Daily · tap to complete · +10 XP",
    type: "action",
    color: "#06B6D4"
  },
  {
    id: "read",
    emoji: "📖",
    title: "Read 10 pages",
    subtitle: "Daily · log pages · goal 10+ · 5–15 XP",
    type: "measurable",
    color: "#8B5CF6",
    unit: "pages",
    target: 10
  },
  {
    id: "walk",
    emoji: "🚶",
    title: "Walk 20 minutes",
    subtitle: "Daily · tap to complete · +10 XP",
    type: "action",
    color: "#10B981"
  }
];

export type TemplatePayload = {
  title: string;
  type: "action" | "measurable";
  color: string;
  schedule: "daily";
  goalDirection: "up";
  target: number | null;
  targetMax: null;
  unit?: string;
  requireCompletionComment?: boolean;
};

/** The create-habit body for a template, shaped like habits/new.tsx builds it. */
export const templatePayload = (template: HabitTemplate): TemplatePayload =>
  template.type === "measurable"
    ? {
        title: template.title,
        type: "measurable",
        color: template.color,
        schedule: "daily",
        goalDirection: "up",
        target: template.target ?? null,
        targetMax: null,
        unit: template.unit
      }
    : {
        title: template.title,
        type: "action",
        color: template.color,
        schedule: "daily",
        goalDirection: "up",
        target: null,
        targetMax: null,
        requireCompletionComment: false
      };

/** A habit with the template's title already exists (replaying the walkthrough). */
export const templateAlreadyAdded = (
  habits: readonly HabitLike[] | null | undefined,
  template: HabitTemplate
) =>
  Array.isArray(habits) &&
  habits.some(
    (habit) =>
      habit &&
      !habit.archived &&
      habit.type !== "expense" &&
      typeof habit.title === "string" &&
      habit.title.trim().toLowerCase() === template.title.toLowerCase()
  );

export const FIRST_HABIT_TOAST = "Day 1 🔥 — your streak has started";

/**
 * The server starts the streak only when the account's very first habit is
 * created, so the Day 1 message is shown only then.
 */
export const habitCreatedToast = (habitsBefore: number, title: string) =>
  habitsBefore === 0 ? FIRST_HABIT_TOAST : `"${title}" added ✓`;
