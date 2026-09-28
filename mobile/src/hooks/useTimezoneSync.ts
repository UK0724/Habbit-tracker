import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { preferencesApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

const deviceTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

/**
 * Keeps the server's timezone (used for "today", streaks and check-ins) in
 * step with the device's, on app open and resume while signed in. Deduped
 * per user and device timezone for the session, like useDailyCheckin, so an
 * ordinary resume does not hit the network. Never throws.
 */
export const useTimezoneSync = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const synced = useRef<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      const timezone = deviceTimezone();
      if (!timezone) return;
      const key = `${userId}:${timezone}`;
      if (synced.current === key || inFlight.current) return;
      inFlight.current = true;
      try {
        const current = await preferencesApi.get();
        if (useAuthStore.getState().user?.id !== userId) return;
        if (current.timezone !== timezone) {
          await preferencesApi.setTimezone(timezone);
          if (useAuthStore.getState().user?.id !== userId) return;
          void queryClient.invalidateQueries({ queryKey: ["habits"] });
          void queryClient.invalidateQueries({ queryKey: ["habit"] });
          void queryClient.invalidateQueries({ queryKey: ["habitLogs"] });
          void queryClient.invalidateQueries({ queryKey: ["habitStats"] });
          void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
        }
        synced.current = key;
      } catch (error) {
        // Silent: retried on the next open/resume.
        console.error("[timezone] Could not sync the device timezone", error);
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
