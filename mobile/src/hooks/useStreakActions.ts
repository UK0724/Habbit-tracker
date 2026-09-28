import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  errorMessage,
  gamificationApi,
  habitApi,
  type GamificationProfile
} from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { repairErrorMessage } from "../utils/streakRepair";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { useRewardCelebration } from "./useRewardCelebration";

export const FREEZE_COST = 2;
export const RESTORE_COST = 5;

export const useRestoreStreak = (onRestored?: () => void) => {
  const celebrate = useRewardCelebration();
  return useMutation({
    mutationFn: gamificationApi.restoreStreak,
    onSuccess: (data) => {
      void hapticSuccess();
      celebrate(data);
      onRestored?.();
      Alert.alert("Streak restored", `You're back on a ${data.streak}-day streak. Keep it going!`);
    },
    onError: (error) => {
      void hapticError();
      Alert.alert("Couldn't restore streak", errorMessage(error));
    }
  });
};

export const useBuyFreeze = () => {
  const celebrate = useRewardCelebration();
  return useMutation({
    mutationFn: gamificationApi.useStreakFreeze,
    onSuccess: (data) => {
      void hapticSuccess();
      celebrate(data);
      Alert.alert(
        "Streak freeze ready",
        `You now have ${data.streakFreezes} ${data.streakFreezes === 1 ? "freeze" : "freezes"}. A freeze covers one missed check-in day.`
      );
    },
    onError: (error) => {
      void hapticError();
      Alert.alert("Couldn't buy a freeze", errorMessage(error));
    }
  });
};

/**
 * Repairs one habit's streak (POST /habits/:id/streak-repair). Pays with a
 * streak freeze when available, otherwise gems (server decides). Every
 * outcome refetches the habit so a stale offer disappears.
 */
export const useRepairHabitStreak = (habitId: string) => {
  const queryClient = useQueryClient();
  const celebrate = useRewardCelebration();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["habits"] }),
      queryClient.invalidateQueries({ queryKey: ["habit", habitId] }),
      queryClient.invalidateQueries({ queryKey: ["habitLogs", habitId] }),
      queryClient.invalidateQueries({ queryKey: ["habitStats", habitId] }),
      queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] }),
      queryClient.invalidateQueries({ queryKey: ["achievements"] })
    ]);
  return useMutation({
    mutationFn: (date: string) => habitApi.repairStreak(habitId, date),
    onMutate: () => ({ userId: useAuthStore.getState().user?.id }),
    onSuccess: (data, _date, context) => {
      if (context?.userId !== useAuthStore.getState().user?.id) return;
      void hapticSuccess();
      // Show the new wallet right away; the refetch below confirms it.
      if (typeof data?.streakFreezes === "number" && typeof data?.gems === "number")
        queryClient.setQueryData<GamificationProfile>(["gamificationProfile"], (profile) =>
          profile ? { ...profile, streakFreezes: data.streakFreezes, gems: data.gems } : profile
        );
      celebrate(data, { message: "Streak repaired ❄️" });
      void refresh();
    },
    onError: (error) => {
      void hapticError();
      const status = error instanceof ApiError ? error.status : undefined;
      if (!(error instanceof ApiError && error.code === "SESSION_CHANGED"))
        Alert.alert(
          "Couldn't repair streak",
          status === 400 || status === 409 || status === 404
            ? repairErrorMessage(status, error.message)
            : errorMessage(error)
        );
      void refresh();
    }
  });
};
