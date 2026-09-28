import { useCallback, useRef, useState } from "react";
import { Share } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type * as SharingModule from "expo-sharing";
import { gamificationApi, type GamificationProfile } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { requestShareCardCapture } from "../stores/shareCardStore";
import { AVATAR_QUERY_KEY, fetchAvatar } from "./useAvatar";
import { useRewardCelebration } from "./useRewardCelebration";
import { APP_LINK, avatarInitial, buildShareMessage, type ShareContent } from "../utils/share";

export { APP_LINK };
export type { ShareContent };

/** Required lazily so a binary without expo-sharing falls back to text. */
const loadSharing = () => {
  try {
    return require("expo-sharing") as typeof SharingModule;
  } catch (error) {
    console.error("[share] expo-sharing unavailable", error);
    return null;
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T) =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

// Module-level: two share buttons (e.g. a badge sheet over Profile) must
// never open two sheets.
let sharingNow = false;

/**
 * Shares a branded image card (captured offscreen by ShareCardHost) via the
 * OS share sheet, falling back to text. Then tells the server (Social Proof)
 * and celebrates any reward.
 */
export const useShare = () => {
  const celebrate = useRewardCelebration();
  const queryClient = useQueryClient();
  const [sharing, setSharing] = useState(false);
  // A ref, not state: a double tap within one frame must not open two sheets.
  const busy = useRef(false);

  const share = useCallback(
    async (content: ShareContent) => {
      if (busy.current || sharingNow) return;
      busy.current = true;
      sharingNow = true;
      setSharing(true);
      try {
        const profile = queryClient.getQueryData<GamificationProfile>(["gamificationProfile"]) ?? null;
        const message = buildShareMessage(content, profile);
        let shared = false;

        try {
          const Sharing = loadSharing();
          if (Sharing && (await Sharing.isAvailableAsync())) {
            const cachedAvatar = queryClient.getQueryData<string | null>(AVATAR_QUERY_KEY);
            const avatar =
              cachedAvatar !== undefined
                ? cachedAvatar
                : await withTimeout(
                    queryClient
                      .fetchQuery({ queryKey: AVATAR_QUERY_KEY, queryFn: fetchAvatar })
                      .catch(() => null),
                    3000,
                    null
                  );
            const uri = await requestShareCardCapture({
              content,
              profile,
              avatar: avatar ?? null,
              initial: avatarInitial(useAuthStore.getState().user?.email)
            });
            if (uri) {
              const fileUri = uri.startsWith("file://") ? uri : `file://${uri}`;
              await Sharing.shareAsync(fileUri, {
                mimeType: "image/png",
                UTI: "public.png",
                dialogTitle: "Share your progress"
              });
              // expo-sharing can't tell a share from a dismissal; like Android's
              // text sheet, the one-time Social Proof bonus accepts that.
              shared = true;
            }
          }
        } catch (error) {
          console.error("[share] Image share failed; falling back to text", error);
        }

        if (!shared) {
          const result = await Share.share({ message });
          // Android reports sharedAction even when the sheet is dismissed; the
          // one-time Social Proof bonus accepts that platform limitation.
          shared = result.action === Share.sharedAction;
        }
        if (!shared) return;
        try {
          celebrate(await gamificationApi.share());
        } catch (error) {
          // The share itself succeeded; the bonus is best effort.
          console.error("[share] Could not record share", error);
        }
      } catch (error) {
        console.error("[share] Share sheet failed", error);
      } finally {
        busy.current = false;
        sharingNow = false;
        setSharing(false);
      }
    },
    [celebrate, queryClient]
  );
  return { share, sharing };
};
