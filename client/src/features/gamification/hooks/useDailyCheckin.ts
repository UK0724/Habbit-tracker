import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../../../stores/authStore";
import { getTodayDateString } from "../../../shared/lib/date";
import { apiRequest } from "../../../services/api";
import {
  applyCheckinResult,
  applyReward,
  type CheckinResult,
  type RewardSummary
} from "../rewards";

export type { CheckinResult } from "../rewards";

const sessionKeyFor = (userId: string) =>
  `pulse_checkin_${userId}_${getTodayDateString()}`;

const readSession = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeSession = (key: string) => {
  try {
    sessionStorage.setItem(key, "true");
  } catch {
    // Storage may be unavailable (private mode); a repeat check-in is harmless.
  }
};

export const useDailyCheckinMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CheckinResult & Partial<RewardSummary>,
    Error,
    { sessionKey?: string } | void
  >({
    mutationFn: () =>
      apiRequest<CheckinResult & Partial<RewardSummary>>(
        "/gamification/checkin",
        { method: "POST" }
      ),
    // Results are handled here so they apply even if the caller unmounts.
    onSuccess: (data, variables) => {
      // No active habit yet: the server recorded nothing. Try again later.
      if (data?.needsHabit) return;
      if (variables && variables.sessionKey) writeSession(variables.sessionKey);
      // XP from the check-in itself is shown on the banner, not as a toast.
      applyReward(queryClient, { ...data, checkin: null }, { skipXpToast: true });
      applyCheckinResult(data);
    }
  });
};

/**
 * Checks in once per browser session (per user and day) from any page. The
 * resulting banner / streak-lost screen is shown by the app layout.
 */
export const useDailyCheckin = () => {
  const { mutate } = useDailyCheckinMutation();
  const checkedRef = useRef<string | null>(null);
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!userId) return;
    const sessionKey = sessionKeyFor(userId);
    if (checkedRef.current === sessionKey || readSession(sessionKey)) return;
    checkedRef.current = sessionKey;
    mutate({ sessionKey });
  }, [mutate, userId]);
};
