import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { jobTrackerService } from "./jobTracker.service.js";

export const getProfileController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const profile = await jobTrackerService.getProfileByUserId(userId);
    response.json({ data: profile });
  }
);

export const updateProfileController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const profile = await jobTrackerService.updateProfileByUserId(userId, request.body);
    response.json({ data: profile });
  }
);
