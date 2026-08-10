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

export const getAllProblemsController = catchAsync(
  async (request: Request, response: Response) => {
    const problems = await dsaPrepService.getAllProblems();
    response.json({ data: problems });
  }
);

export const getProblemByIdController = catchAsync(
  async (request: Request, response: Response) => {
    const { id } = request.params;
    const problem = await dsaPrepService.getProblemById(Number(id));
    if (!problem) {
      response.status(404).json({ error: "Problem not found" });
      return;
    }
    response.json({ data: problem });
  }
);

export const markProblemSolvedController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const { problemId, language, notes } = request.body;

    const profile = await dsaPrepService.markSolved(
      userId,
      problemId,
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

    const profile = await dsaPrepService.unmarkSolved(userId, problemId);
    response.json({ data: profile });
  }
);
