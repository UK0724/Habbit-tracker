import type { Request, Response } from "express";

import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createHabitLog,
  getTodayLogs,
  listHabitLogs,
  updateHabitLog
} from "./habitLog.service.js";

export const listHabitLogsController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const logs = await listHabitLogs(
      request.params.id as string,
      userId,
      request.query.limit as number | undefined
    );
    response.json({ data: logs });
  }
);

export const createHabitLogController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const log = await createHabitLog(request.params.id as string, userId, request.body);
    response.status(201).json({ data: log });
  }
);

export const updateHabitLogController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const log = await updateHabitLog(
      request.params.id as string,
      request.params.logId as string,
      userId,
      request.body
    );
    response.json({ data: log });
  }
);

export const getTodayLogsController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const logs = await getTodayLogs(userId);
    response.json({ data: logs });
  }
);
