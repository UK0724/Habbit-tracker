import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../../services/api";
import { applyReward, type RewardSummary } from "../rewards";

export interface GameProfile {
  userId: string;
  totalXP: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  /** null at the max level. */
  xpNeeded: number | null;
  gems: number;
  loginStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  streakFreezes: number;
  achievementCount: number;
  /** Total number of achievements that exist (absent on older servers). */
  achievementTotal?: number;
  brokenStreak?: {
    previousStreak: number;
    restoreExpiresAt: string | null;
  } | null;
  today: string;
}

export const GAME_PROFILE_QUERY_KEY = ["gamification", "profile"] as const;

export const useGameProfile = () => {
  return useQuery<GameProfile>({
    queryKey: GAME_PROFILE_QUERY_KEY,
    queryFn: () => apiRequest<GameProfile>("/gamification/profile"),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1
  });
};

export const useStreakFreeze = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<{ gems: number; streakFreezes: number } & Partial<RewardSummary>>(
        "/gamification/freeze",
        { method: "POST" }
      ),
    onSuccess: (data) => {
      // Buying a freeze can unlock a badge (e.g. Wise Spender).
      applyReward(queryClient, data, { skipXpToast: true });
      void queryClient.invalidateQueries({ queryKey: GAME_PROFILE_QUERY_KEY });
    }
  });
};

export const useRestoreStreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<{ streak: number; gems: number } & Partial<RewardSummary>>(
        "/gamification/restore-streak",
        { method: "POST" }
      ),
    onSuccess: (data) => {
      applyReward(queryClient, data, { title: "Streak restored" });
      void queryClient.invalidateQueries({ queryKey: GAME_PROFILE_QUERY_KEY });
    }
  });
};
