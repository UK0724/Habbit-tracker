import { create } from "zustand";
import type { AchievementItem } from "../services/api";

/**
 * Celebration queue. XP toasts are non-modal and live in their own slot;
 * modal celebrations (achievements, streak sheet, level-up) queue up and
 * show one at a time in the order they were enqueued.
 */
export type XpCelebration = {
  kind: "xp";
  id: number;
  xp: number;
  gems: number;
  legendaryDay: boolean;
  /** Automatic daily check-in that rode along with this action (its XP is separate). */
  checkin?: { xp: number; streak: number } | null;
  /** Optional lead text, e.g. "Streak repaired ❄️". */
  message?: string | null;
};
export type AchievementCelebration = {
  kind: "achievement";
  id: number;
  /** Unlock bursts collapse into one sheet ("+N more"). */
  achievements: AchievementItem[];
  mode: "unlock" | "details";
};
export type LevelUpCelebration = {
  kind: "levelUp";
  id: number;
  level: number;
  title: string;
};
export type StreakCelebration = {
  kind: "streak";
  id: number;
  previousStreak: number;
  canRestore: boolean;
  restoreCost: number;
  restoreExpiresAt: string | null;
};
export type ModalCelebration =
  | AchievementCelebration
  | LevelUpCelebration
  | StreakCelebration;
export type Celebration = XpCelebration | ModalCelebration;

type Without<T> = T extends unknown ? Omit<T, "id"> : never;
export type CelebrationInput =
  | Without<XpCelebration>
  | Omit<AchievementCelebration, "id" | "mode">
  | Without<LevelUpCelebration>
  | Without<StreakCelebration>;

interface CelebrationState {
  toast: XpCelebration | null;
  current: ModalCelebration | null;
  queue: ModalCelebration[];
  celebrated: string[];
  /** Level-ups already shown, so a repeated reward never replays one. */
  celebratedLevels: number[];
  enqueue: (item: CelebrationInput) => void;
  viewAchievement: (achievement: AchievementItem) => void;
  dismissToast: () => void;
  /** Pass the celebration id so a late callback can't dismiss a newer item. */
  dismiss: (id?: number) => void;
  reset: () => void;
}

let nextId = 1;

const initial = {
  toast: null as XpCelebration | null,
  current: null as ModalCelebration | null,
  queue: [] as ModalCelebration[],
  celebrated: [] as string[],
  celebratedLevels: [] as number[]
};

/** Level-ups stay the finale: other celebrations queue ahead of them. */
const push = (state: CelebrationState, item: ModalCelebration) => {
  if (!state.current) return { current: item };
  if (item.kind === "levelUp") return { queue: [...state.queue, item] };
  const firstLevelUp = state.queue.findIndex((queued) => queued.kind === "levelUp");
  if (firstLevelUp < 0) return { queue: [...state.queue, item] };
  const queue = [...state.queue];
  queue.splice(firstLevelUp, 0, item);
  return { queue };
};

export const useCelebrationStore = create<CelebrationState>((set) => ({
  ...initial,
  enqueue: (input) =>
    set((state) => {
      const id = nextId++;
      if (input.kind === "xp") {
        if (input.xp === 0 && input.gems === 0 && !input.legendaryDay && !input.checkin && !input.message)
          return state;
        return { toast: { ...input, id } };
      }
      if (input.kind === "achievement") {
        // Rewards list only new unlocks and omit `unlocked`; only an explicit
        // `unlocked: false` marks a locked badge.
        const fresh = input.achievements.filter(
          (achievement, index, all) =>
            achievement.unlocked !== false &&
            !state.celebrated.includes(achievement.id) &&
            all.findIndex((other) => other.id === achievement.id) === index
        );
        if (fresh.length === 0) return state;
        return {
          celebrated: [...state.celebrated, ...fresh.map((achievement) => achievement.id)],
          ...push(state, { kind: "achievement", id, achievements: fresh, mode: "unlock" })
        };
      }
      if (input.kind === "levelUp") {
        if (state.celebratedLevels.includes(input.level)) return state;
        return {
          celebratedLevels: [...state.celebratedLevels, input.level],
          ...push(state, { ...input, id })
        };
      }
      if (
        state.current?.kind === "streak" ||
        state.queue.some((item) => item.kind === "streak")
      )
        return state;
      return push(state, { ...input, id });
    }),
  viewAchievement: (achievement) =>
    set((state) => {
      if (state.current) return state;
      return {
        current: { kind: "achievement", id: nextId++, achievements: [achievement], mode: "details" }
      };
    }),
  dismissToast: () => set({ toast: null }),
  dismiss: (id) =>
    set((state) =>
      id != null && state.current?.id !== id
        ? state
        : { current: state.queue[0] ?? null, queue: state.queue.slice(1) }
    ),
  reset: () => set(initial)
}));

/** Backwards-compatible name used by older call sites. */
export const useAchievementStore = useCelebrationStore;
