import { useAuthStore } from "../../../stores/authStore";
import { getTodayDateString } from "../../../shared/lib/date";
import { useEffect,useRef,useState } from "react";
import { useMutation,useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../../services/api";
import { GAME_PROFILE_QUERY_KEY } from "./useGameProfile";
import { ACHIEVEMENTS_QUERY_KEY } from "./useAchievements";

export interface CheckinResult {
  alreadyCheckedIn: boolean;
  streak: number;
  longestStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  xpAwarded: number;
}

export const useDailyCheckinMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CheckinResult, Error>({
    mutationFn: () =>
      apiRequest<CheckinResult>("/gamification/checkin", {
        method: "POST"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GAME_PROFILE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_QUERY_KEY });
    }
  });
};

/**
 * Checks in automatically once per session on mount.
 * Returns check-in data and state for showing StreakLostScreen or DailyCheckInBanner.
 */
export const useDailyCheckin = () => {
  const mutation = useDailyCheckinMutation();
  const checkedRef = useRef<string | null>(null);
  const userId = useAuthStore(state => state.user?.id);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [showStreakLost, setShowStreakLost] = useState(false);
  const [showDailyBanner, setShowDailyBanner] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const sessionKey = `pulse_checkin_${userId}_${getTodayDateString()}`;
    if (checkedRef.current === sessionKey) return;
    if (sessionStorage.getItem(sessionKey)) return;

    checkedRef.current = sessionKey;
    mutation.mutate(undefined, {
      onSuccess: (data) => {
        sessionStorage.setItem(sessionKey, "true");
        setResult(data);
        if (data.streakBroken) {
          setShowStreakLost(true);
        } else if (!data.alreadyCheckedIn) {
          setShowDailyBanner(true);
        }
      }
    });
  }, [mutation, userId]);

  return {
    ...mutation,
    result,
    showStreakLost,
    setShowStreakLost,
    showDailyBanner,
    setShowDailyBanner
  };
};
