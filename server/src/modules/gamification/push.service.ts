import webpush from "web-push";
import { env } from "../../config/env.js";
import { PushSubscriptionModel } from "./gamification.model.js";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Configure VAPID details once at module load time.
// If VAPID keys are not set, push notifications are silently disabled.
const vapidConfigured = Boolean(
  env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_CONTACT_EMAIL
);

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_CONTACT_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_CONTACT_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

/**
 * Sends a push notification to a single subscription endpoint.
 * If the subscription is expired (410) or invalid (404), it is deleted from the DB.
 */
export const sendPush = async (
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<void> => {
  if (!vapidConfigured) return;

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: unknown) {
    if (err && typeof err === "object" && "statusCode" in err) {
      const statusCode = (err as { statusCode: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription is gone — clean up
        await PushSubscriptionModel.deleteOne({
          endpoint: subscription.endpoint
        });
        return;
      }
    }
    // Other errors (e.g. network) — log but don't crash the caller
    console.error("[push.service] Failed to send push notification:", err);
  }
};
