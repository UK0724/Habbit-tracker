import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../../services/api";

export interface GameProfile {
  userId: string;
  totalXP: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpNeeded: number | null;
  gems: number;
  loginStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  streakFreezes: number;
  achievementCount: number;
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
      apiRequest<{ gems: number; streakFreezes: number }>("/gamification/freeze", {
        method: "POST"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GAME_PROFILE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["gamification", "achievements"] });
    }
  });
};
