import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { gamificationService } from "./gamification.service.js";
import { env } from "../../config/env.js";

export const getProfileController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const profile = await gamificationService.getProfile(userId);
    response.json({ data: profile });
  }
);

export const getAchievementsController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const achievements = await gamificationService.getAchievements(userId);
    response.json({ data: achievements });
  }
);

export const checkinController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const result = await gamificationService.dailyCheckin(userId);
    response.json({ data: result });
  }
);

export const issueAdTokenController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const result = await gamificationService.issueAdToken(userId);
    response.json({ data: result });
  }
);

export const restoreStreakController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const { adToken } = request.body as { adToken: string };
    if (!adToken) {
      response.status(400).json({ message: "adToken is required" });
      return;
    }
    const result = await gamificationService.restoreStreakWithAd(
      userId,
      adToken
    );
    response.json({ data: result });
  }
);

export const useStreakFreezeController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const result = await gamificationService.useStreakFreeze(userId);
    response.json({ data: result });
  }
);

export const getVapidKeyController = catchAsync(
  async (_request: Request, response: Response) => {
    response.json({ data: { publicKey: env.VAPID_PUBLIC_KEY || null } });
  }
);

export const subscribePushController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const { endpoint, keys } = request.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      response.status(400).json({ message: "endpoint and keys are required" });
      return;
    }
    const userAgent = request.headers["user-agent"] ?? "";
    const result = await gamificationService.subscribePush(
      userId,
      { endpoint, keys },
      userAgent
    );
    response.status(201).json({ data: result });
  }
);

export const unsubscribePushController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const result = await gamificationService.unsubscribePush(userId);
    response.json({ data: result });
  }
);
