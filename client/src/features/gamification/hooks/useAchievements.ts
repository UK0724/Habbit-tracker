import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../../services/api";
import {
  getAchievementEmoji,
  type AchievementCategory,
  type AchievementTier
} from "../../../shared/lib/gamification";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xpBonus: number;
  /** Gems granted on unlock (absent on older servers). */
  gemBonus?: number;
  tier: AchievementTier;
  category?: AchievementCategory;
  emoji?: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export const ACHIEVEMENTS_QUERY_KEY = ["gamification", "achievements"] as const;

export const useAchievements = () => {
  return useQuery<Achievement[]>({
    queryKey: ACHIEVEMENTS_QUERY_KEY,
    queryFn: async () => {
      const data = await apiRequest<Achievement[]>("/gamification/achievements");
      return (data ?? []).map((item) => ({
        ...item,
        emoji: getAchievementEmoji(item.id, item.emoji)
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
};
