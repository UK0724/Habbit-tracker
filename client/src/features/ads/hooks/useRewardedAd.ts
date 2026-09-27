import { useState,useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdService } from "../AdService";
import { apiRequest } from "../../../services/api";

export interface RestoreStreakResponse {
  streak: number;
  restored: boolean;
}

export interface UseRewardedAdOptions {
  onSuccess?: (data: RestoreStreakResponse) => void;
  onError?: (error: Error) => void;
  onSkipped?: () => void;
}

export interface UseRewardedAdReturn {
  watchAd: () => Promise<RestoreStreakResponse | null>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook coordinating AdService.requestAd, AdService.showAd,
 * and calling POST /api/gamification/restore with the completed ad token.
 */
export function useRewardedAd(options?: UseRewardedAdOptions): UseRewardedAdReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  const watchAd = useCallback(async (): Promise<RestoreStreakResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Request ad token and AdRequest object from active provider
      const adRequest = await AdService.requestAd("rewarded");

      // 2. Display the rewarded ad overlay/slot
      const adResult = await AdService.showAd(adRequest);

      // 3. Handle AdResult
      if (adResult.status === "completed") {
        // Call POST /api/gamification/restore with the server token
        const restoreData = await apiRequest<RestoreStreakResponse>(
          "/gamification/restore",
          {
            method: "POST",
            body: JSON.stringify({ adToken: adResult.token })
          }
        );

        // Invalidate relevant queries so UI refreshes streak counts across app
        await Promise.allSettled([
          queryClient.invalidateQueries({ queryKey: ["gamification"] }),
          queryClient.invalidateQueries({ queryKey: ["habits"] }),
          queryClient.invalidateQueries({ queryKey: ["insights"] })
        ]);

        options?.onSuccess?.(restoreData);
        return restoreData;
      }

      if (adResult.status === "skipped") {
        options?.onSkipped?.();
        return null;
      }

      if (adResult.status === "failed") {
        const failureError = new Error(adResult.reason || "Rewarded ad playback failed");
        setError(failureError);
        options?.onError?.(failureError);
        return null;
      }

      return null;
    } catch (err: unknown) {
      const formattedError =
        err instanceof Error ? err : new Error(String(err));
      setError(formattedError);
      options?.onError?.(formattedError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options, queryClient]);

  return {
    watchAd,
    isLoading,
    error
  };
}
