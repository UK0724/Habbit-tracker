import { z } from "zod";
import { validateRequest } from "../../middleware/validateRequest.js";
import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  getProfileController,
  getAchievementsController,
  checkinController,
  issueAdTokenController,
  restoreStreakController,
  useStreakFreezeController,
  getVapidKeyController,
  subscribePushController,
  unsubscribePushController
} from "./gamification.controller.js";

export const gamificationRouter = Router();

// All routes require authentication
gamificationRouter.use(requireAuth);

// Profile & achievements
gamificationRouter.get("/profile", getProfileController);
gamificationRouter.get("/achievements", getAchievementsController);

// Daily check-in
gamificationRouter.post("/checkin", checkinController);

// Ad-token flow for streak restore
gamificationRouter.post("/ad-token", issueAdTokenController);
gamificationRouter.post(
  "/restore",
  validateRequest({
    body: z.object({ adToken: z.string().min(1).max(2048) }).strict()
  }),
  restoreStreakController
);

// Streak freeze (costs 2 gems)
gamificationRouter.post("/freeze", useStreakFreezeController);

// Push notifications
gamificationRouter.get("/push/vapid-key", getVapidKeyController);
const pushSubscriptionSchema = z
  .object({
    endpoint: z
      .string()
      .url()
      .max(2048)
      .refine((value) => {
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          !url.username &&
          !url.password &&
          !url.port &&
          (url.hostname === "fcm.googleapis.com" ||
            url.hostname === "updates.push.services.mozilla.com" ||
            url.hostname === "web.push.apple.com" ||
            url.hostname.endsWith(".push.apple.com"))
        );
      }, "Unsupported push service"),
    keys: z
      .object({
        p256dh: z
          .string()
          .regex(/^[A-Za-z0-9_=-]+$/)
          .min(40)
          .max(256),
        auth: z
          .string()
          .regex(/^[A-Za-z0-9_=-]+$/)
          .min(16)
          .max(128)
      })
      .strict()
  })
  .strict();
gamificationRouter.post(
  "/push/subscribe",
  validateRequest({ body: pushSubscriptionSchema }),
  subscribePushController
);
gamificationRouter.delete("/push/unsubscribe", unsubscribePushController);
