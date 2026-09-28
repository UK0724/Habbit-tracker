import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";

import type {
  AchievementCategory,
  AchievementTier
} from "../../shared/lib/gamification";
import { getAchievementEmoji } from "../../shared/lib/gamification";
import { pushToast } from "../../stores/xpToastStore";

/** An achievement unlocked by an action (bonuses already applied server-side). */
export type RewardAchievement = {
  id: string;
  emoji?: string;
  name: string;
  description: string;
  xpBonus: number;
  gemBonus?: number;
  tier?: AchievementTier;
  category?: AchievementCategory;
};

export type CheckinResult = {
  alreadyCheckedIn: boolean;
  streak: number;
  longestStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  xpAwarded: number;
  /** Streak length before this check-in (what the user lost). */
  previousStreak?: number;
  canRestore?: boolean;
  restoreCost?: number;
  restoreExpiresAt?: string | null;
  /** No active habit yet: nothing was recorded, so show nothing. */
  needsHabit?: boolean;
};

export type RewardSummary = {
  /** Net XP from this action; may be negative on undo. Excludes badge XP. */
  xpAwarded: number;
  newAchievements: RewardAchievement[];
  levelUp: { level: number; title: string } | null;
  gemsAwarded: number;
  legendaryDay: boolean;
  checkin: CheckinResult | null;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Accepts whatever the server sent and returns a well-formed summary, or null
 * when there is nothing usable (older servers omit `reward` entirely).
 */
export const normalizeReward = (value: unknown): RewardSummary | null => {
  if (!isObject(value)) return null;
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : 0;
  const levelUp = isObject(value.levelUp)
    ? {
        level: num(value.levelUp.level),
        title:
          typeof value.levelUp.title === "string" ? value.levelUp.title : ""
      }
    : null;
  return {
    xpAwarded: num(value.xpAwarded),
    gemsAwarded: Math.max(0, num(value.gemsAwarded)),
    newAchievements: Array.isArray(value.newAchievements)
      ? (value.newAchievements as unknown[]).filter(
          (a): a is RewardAchievement =>
            isObject(a) && typeof a.id === "string"
        )
      : [],
    levelUp: levelUp && levelUp.level > 0 ? levelUp : null,
    legendaryDay: value.legendaryDay === true,
    checkin: isCheckinResult(value.checkin) ? value.checkin : null
  };
};

export const isCheckinResult = (value: unknown): value is CheckinResult =>
  isObject(value) &&
  typeof value.streak === "number" &&
  typeof value.alreadyCheckedIn === "boolean";

// ─── Reward presentation state ────────────────────────────────────────────

type CheckinBanner = { streak: number; xpAwarded: number; freezeUsed: boolean };

type RewardState = {
  levelUp: { level: number; title: string; gems: number } | null;
  achievements: RewardAchievement[];
  legendary: boolean;
  checkinBanner: CheckinBanner | null;
  streakLost: CheckinResult | null;
  dismissLevelUp: () => void;
  dismissAchievement: () => void;
  dismissLegendary: () => void;
  dismissCheckinBanner: () => void;
  dismissStreakLost: () => void;
};

export const useRewardStore = create<RewardState>((set) => ({
  levelUp: null,
  achievements: [],
  legendary: false,
  checkinBanner: null,
  streakLost: null,
  dismissLevelUp: () => set({ levelUp: null }),
  dismissAchievement: () =>
    set((state) => ({ achievements: state.achievements.slice(1) })),
  dismissLegendary: () => set({ legendary: false }),
  dismissCheckinBanner: () => set({ checkinBanner: null }),
  dismissStreakLost: () => set({ streakLost: null })
}));

export const invalidateGamification = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ["gamification", "profile"] }),
    queryClient.invalidateQueries({
      queryKey: ["gamification", "achievements"]
    })
  ]);

/** Show the result of a daily check-in (explicit or automatic). */
export const applyCheckinResult = (result: CheckinResult | null | undefined) => {
  if (!result || result.alreadyCheckedIn || result.needsHabit) return;
  if (result.streakBroken) {
    useRewardStore.setState({ streakLost: result, checkinBanner: null });
    return;
  }
  useRewardStore.setState({
    checkinBanner: {
      streak: result.streak,
      xpAwarded: result.xpAwarded,
      freezeUsed: result.freezeUsed
    }
  });
};

type ApplyRewardOptions = {
  /** Headline for a positive XP toast (e.g. "Completed!"). */
  title?: string;
  /** Headline for a negative XP toast. */
  undoTitle?: string;
  /** Do not toast XP (e.g. the check-in banner already shows it). */
  skipXpToast?: boolean;
};

/**
 * Turn a server RewardSummary into UI feedback: XP / gem toasts, level-up,
 * achievement banners and the Legendary Day celebration. Missing or malformed
 * rewards are ignored so older servers simply produce no feedback.
 */
export const applyReward = (
  queryClient: QueryClient,
  raw: unknown,
  options: ApplyRewardOptions = {}
) => {
  const reward = normalizeReward(raw);
  if (!reward) return;

  if (!options.skipXpToast && reward.xpAwarded !== 0) {
    pushToast(
      reward.xpAwarded > 0
        ? {
            amount: reward.xpAwarded,
            label: "XP",
            title: options.title ?? "Nice work!",
            tone: "gain"
          }
        : {
            amount: reward.xpAwarded,
            label: "XP",
            title: options.undoTitle ?? "Undone",
            tone: "loss"
          }
    );
  }
  if (reward.gemsAwarded > 0) {
    pushToast({
      amount: reward.gemsAwarded,
      label: "💎",
      title: reward.gemsAwarded === 1 ? "Gem earned" : "Gems earned",
      tone: "gems"
    });
  }

  const achievements = reward.newAchievements.map((a) => ({
    ...a,
    emoji: getAchievementEmoji(a.id, a.emoji)
  }));
  const achievementGems = achievements.reduce(
    (sum, a) => sum + (a.gemBonus ?? 0),
    0
  );

  useRewardStore.setState((state) => ({
    levelUp: reward.levelUp
      ? {
          ...reward.levelUp,
          gems: Math.max(0, reward.gemsAwarded - achievementGems)
        }
      : state.levelUp,
    achievements: achievements.length
      ? [...state.achievements, ...achievements]
      : state.achievements,
    legendary: state.legendary || reward.legendaryDay
  }));

  applyCheckinResult(reward.checkin);
  void invalidateGamification(queryClient);
};
