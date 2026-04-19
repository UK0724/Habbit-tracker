import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync.js";
import {
  createHabitLog,
  getTodayLogs,
  listHabitLogs,
  updateHabitLog
} from "./habitLog.service.js";

export const listHabitLogsController = catchAsync(
  async (request: Request, response: Response) => {
    const habitId = request.params.id as string;
    const logs = await listHabitLogs(
      habitId,
      request.query.limit as number | undefined
    );

    response.json({
      data: logs
    });
  }
);

export const createHabitLogController = catchAsync(
  async (request: Request, response: Response) => {
    const habitId = request.params.id as string;
    const log = await createHabitLog(habitId, request.body);

    response.status(201).json({
      data: log
    });
  }
);

export const updateHabitLogController = catchAsync(
  async (request: Request, response: Response) => {
    const habitId = request.params.id as string;
    const logId = request.params.logId as string;
    const log = await updateHabitLog(
      habitId,
      logId,
      request.body
    );

    response.json({
      data: log
    });
  }
);

export const getTodayLogsController = catchAsync(
  async (_request: Request, response: Response) => {
    const logs = await getTodayLogs();

    response.json({
      data: logs
    });
  }
);
