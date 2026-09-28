import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { gamificationApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { localDateString } from "../utils/date";
import { celebrateReward } from "./useRewardCelebration";

/**
 * Checks in automatically when the app opens or resumes (signed in only).
 * The server is idempotent per day; locally we skip repeat calls once a
 * check-in for this user and local date succeeded, so a resume after
 * midnight checks in again but ordinary resumes do not hit the network.
 */
export const useDailyCheckin = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const done = useRef<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      const key = `${userId}:${localDateString()}`;
      if (done.current === key || inFlight.current) return;
      inFlight.current = true;
      try {
        const result = await gamificationApi.dailyCheckin();
        if (useAuthStore.getState().user?.id !== userId) return;
        // No active habit yet: nothing was recorded. Don't mark the day done,
        // so a later resume (after the first habit is created) tries again.
        if (result.needsHabit) {
          void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
          return;
        }
        done.current = key;
        if (result.alreadyCheckedIn) {
          void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
          return;
        }
        celebrateReward(queryClient, result, { checkin: result });
      } catch (error) {
        // Silent: the Profile check-in card still works manually.
        console.error("[checkin] Automatic check-in failed", error);
      } finally {
        inFlight.current = false;
      }
    };
    void run();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void run();
    });
    return () => subscription.remove();
  }, [userId, queryClient]);
};
