import type { Request, Response } from "express";

import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createHabit,
  deleteHabit,
  getHabit,
  getHabitStats,
  listArchivedHabits,
  listHabits,
  setHabitArchived,
  updateHabit
} from "./habit.service.js";

export const listHabitsController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const habits = await listHabits(userId, request.query.date as string | undefined);
    response.json({ data: habits });
  }
);

export const createHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const habit = await createHabit({ ...request.body, userId });
    response.status(201).json({ data: habit });
  }
);

export const getHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const habit = await getHabit(request.params.id as string, userId);
    response.json({ data: habit });
  }
);

export const updateHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const habit = await updateHabit(request.params.id as string, userId, request.body);
    response.json({ data: habit });
  }
);

export const deleteHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    await deleteHabit(request.params.id as string, userId);
    response.status(204).send();
  }
);

export const listArchivedHabitsController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const habits = await listArchivedHabits(userId);
    response.json({ data: habits });
  }
);

export const archiveHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const habit = await setHabitArchived(
      request.params.id as string,
      userId,
      Boolean(request.body.archived)
    );
    response.json({ data: habit });
  }
);

export const getHabitStatsController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const stats = await getHabitStats(request.params.id as string, userId);
    response.json({ data: stats });
  }
);
