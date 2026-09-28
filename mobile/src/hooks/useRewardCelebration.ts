import { useCallback } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCelebrationStore } from "../stores/achievementStore";
import type { CheckinResult, RewardSummary } from "../services/api";

export type RewardLike = Partial<RewardSummary> | null | undefined;

/**
 * Routes a server reward into the celebration queue:
 * XP toast → achievements → (streak lost) → level-up finale.
 * Tolerates a missing or partial reward (older servers).
 *
 * Two shapes:
 *  - action rewards (logs, freeze, restore, share): `xpAwarded` is the action's
 *    XP (incl. Legendary Day). An automatic check-in that rode along arrives in
 *    `reward.checkin` with its own `xpAwarded`, shown as a separate toast part.
 *  - the check-in endpoint: pass `{ checkin: result }`; then the top-level
 *    `xpAwarded` *is* the check-in XP.
 */
export const celebrateReward = (
  queryClient: QueryClient,
  reward: RewardLike,
  options: { checkin?: CheckinResult | null; message?: string } = {}
) => {
  void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
  void queryClient.invalidateQueries({ queryKey: ["achievements"] });
  // No active habit yet: the server recorded nothing, so there is nothing to celebrate.
  if (options.checkin?.needsHabit) return;
  if (!reward && !options.checkin && !options.message) return;
  const { enqueue } = useCelebrationStore.getState();

  const direct = options.checkin ?? null;
  const rideAlong = reward?.checkin?.needsHabit ? null : reward?.checkin ?? null;
  const checkin = direct ?? rideAlong;
  const topXp = Number(reward?.xpAwarded ?? 0) || 0;
  const actionXp = direct ? 0 : topXp;
  const checkinXp = direct ? topXp : Number(checkin?.xpAwarded ?? 0) || 0;
  const gems = Math.max(0, Number(reward?.gemsAwarded ?? 0) || 0);
  enqueue({
    kind: "xp",
    xp: actionXp,
    gems,
    legendaryDay: Boolean(reward?.legendaryDay),
    message: options.message ?? null,
    checkin:
      checkin && !checkin.alreadyCheckedIn
        ? { xp: checkinXp, streak: Number(checkin.streak) || 1 }
        : null
  });

  const achievements = Array.isArray(reward?.newAchievements) ? reward.newAchievements : [];
  if (achievements.length > 0) enqueue({ kind: "achievement", achievements });

  if (checkin?.streakBroken && !checkin.freezeUsed) {
    enqueue({
      kind: "streak",
      previousStreak: checkin.previousStreak ?? 0,
      canRestore: Boolean(checkin.canRestore),
      restoreCost: checkin.restoreCost ?? 5,
      restoreExpiresAt: checkin.restoreExpiresAt ?? null
    });
  }

  const levelUp = reward?.levelUp;
  if (levelUp && typeof levelUp.level === "number")
    enqueue({ kind: "levelUp", level: levelUp.level, title: levelUp.title ?? "" });
};

export const useRewardCelebration = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (reward: RewardLike, options?: { checkin?: CheckinResult | null; message?: string }) =>
      celebrateReward(queryClient, reward, options),
    [queryClient]
  );
};
