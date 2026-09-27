import { useEffect,useState,useCallback } from "react";
import { apiRequest } from "../../services/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export const usePushNotifications = (): PushNotificationState => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission);

    // Register service worker and inspect existing subscription
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(Boolean(subscription));
      })
      .catch((err) => {
        console.warn("[push] Service worker registration error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported by this browser.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Request user permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setError("Notification permission was denied.");
        return false;
      }

      // 2. Fetch public VAPID key
      const { publicKey } = await apiRequest<{ publicKey: string | null }>(
        "/gamification/push/vapid-key"
      );

      if (!publicKey) {
        setError("Push notification server keys are not configured.");
        return false;
      }

      // 3. Subscribe with PushManager
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: new Uint8Array(urlBase64ToUint8Array(publicKey)).buffer
        });
      }

      const rawSub = subscription.toJSON();
      if (!rawSub.endpoint || !rawSub.keys) {
        throw new Error("Invalid push subscription format received from browser.");
      }

      // 4. Send subscription to server
      await apiRequest("/gamification/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: rawSub.endpoint,
          keys: {
            p256dh: rawSub.keys.p256dh,
            auth: rawSub.keys.auth
          }
        })
      });

      setIsSubscribed(true);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe to push notifications";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      await apiRequest("/gamification/push/unsubscribe", {
        method: "DELETE"
      });

      setIsSubscribed(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe
  };
};
