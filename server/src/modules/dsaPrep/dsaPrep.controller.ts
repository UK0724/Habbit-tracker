import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { dsaPrepService } from "./dsaPrep.service.js";

export const getDsaProfileController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const profile = await dsaPrepService.getProfileByUserId(userId);
    response.json({ data: profile });
  }
);

export const markProblemSolvedController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const { problemId, language, notes } = request.body;

    if (problemId === undefined || !language) {
      response.status(400).json({ error: "problemId and language are required" });
      return;
    }

    const profile = await dsaPrepService.markSolved(
      userId,
      Number(problemId),
      language,
      notes
    );
    response.json({ data: profile });
  }
);

export const unmarkProblemSolvedController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const { problemId } = request.body;

    if (problemId === undefined) {
      response.status(400).json({ error: "problemId is required" });
      return;
    }

    const profile = await dsaPrepService.unmarkSolved(
      userId,
      Number(problemId)
    );
    response.json({ data: profile });
  }
);
