import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync.js";
import {
  createHabit,
  deleteHabit,
  getHabit,
  getHabitStats,
  listHabits,
  updateHabit
} from "./habit.service.js";

export const listHabitsController = catchAsync(
  async (request: Request, response: Response) => {
    const habits = await listHabits(request.query.date as string | undefined);

    response.json({
      data: habits
    });
  }
);

export const createHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const habit = await createHabit(request.body);

    response.status(201).json({
      data: habit
    });
  }
);

export const getHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const habitId = request.params.id as string;
    const habit = await getHabit(habitId);

    response.json({
      data: habit
    });
  }
);

export const updateHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const habitId = request.params.id as string;
    const habit = await updateHabit(habitId, request.body);

    response.json({
      data: habit
    });
  }
);

export const deleteHabitController = catchAsync(
  async (request: Request, response: Response) => {
    const habitId = request.params.id as string;
    await deleteHabit(habitId);

    response.status(204).send();
  }
);

export const getHabitStatsController = catchAsync(
  async (request: Request, response: Response) => {
    const habitId = request.params.id as string;
    const stats = await getHabitStats(habitId);

    response.json({
      data: stats
    });
  }
);
