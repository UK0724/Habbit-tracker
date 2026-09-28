import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../../middleware/requireAuth.js";
import { HabitModel } from "./habit.model.js";
import { HabitLogModel } from "../habitLogs/habitLog.model.js";
import { ExpenseModel, BudgetModel } from "../expenses/expense.model.js";
import { UserModel } from "../auth/user.model.js";
import { serializeHabit, serializeHabitLog } from "./habit.service.js";
import { summarize } from "./rules.js";
import { handleHabitLogXP } from "../gamification/gamification.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { isValidDateString } from "../../utils/date.js";
import { userToday } from "./workspaceSync.js";

export const trackingRouter = Router();
trackingRouter.use(requireAuth);
trackingRouter.get(
  "/insights",
  catchAsync(async (req, res) => {
    const userId = (req as AuthRequest).userId;
    const today = z
      .string()
      .refine(isValidDateString)
      .parse(req.query.date ?? (await userToday(userId)));
    const days = z.coerce
      .number()
      .int()
      .min(7)
      .max(366)
      .parse(req.query.days ?? 30);
    const habits = await HabitModel.find({ userId, archived: { $ne: true } });
    const logs = await HabitLogModel.find({
      habitId: { $in: habits.map((h) => h._id) },
      date: { $lte: today }
    });
    res.json({
      data: habits.map((habit) => ({
        habit: serializeHabit(habit),
        ...summarize(
          habit,
          logs.filter((l) => l.habitId.equals(habit._id)),
          today,
          days
        )
      }))
    });
  })
);
trackingRouter.get(
  "/export",
  catchAsync(async (req, res) => {
    const userId = (req as AuthRequest).userId;
    const [habits, expenses, budgets] = await Promise.all([
      HabitModel.find({ userId }),
      ExpenseModel.find({ userId }),
      BudgetModel.find({ userId })
    ]);
    const logs = await HabitLogModel.find({
      habitId: { $in: habits.map((h) => h._id) }
    });
    res.json({
      data: {
        version: 1,
        exportedAt: new Date().toISOString(),
        habits: habits.map(serializeHabit),
        logs: logs.map(serializeHabitLog),
        expenses,
        budgets
      }
    });
  })
);
trackingRouter.get(
  "/preferences",
  catchAsync(async (req, res) => {
    const user = await UserModel.findById((req as AuthRequest).userId);
    res.json({ data: { timezone: user?.timezone ?? "UTC" } });
  })
);
trackingRouter.patch(
  "/preferences",
  catchAsync(async (req, res) => {
    const { timezone } = z
      .object({
        timezone: z
          .string()
          .max(100)
          .refine((value) => {
            try {
              new Intl.DateTimeFormat("en", { timeZone: value });
              return true;
            } catch {
              return false;
            }
          }, "Choose a valid timezone")
      })
      .strict()
      .parse(req.body);
    await UserModel.updateOne(
      { _id: (req as AuthRequest).userId },
      { $set: { timezone } }
    );
    res.json({ data: { timezone } });
  })
);
trackingRouter.delete(
  "/habits/:id/logs/:logId",
  catchAsync(async (req, res) => {
    const id = z
      .string()
      .regex(/^[a-f0-9]{24}$/i)
      .parse(req.params.id);
    const logId = z
      .string()
      .regex(/^[a-f0-9]{24}$/i)
      .parse(req.params.logId);
    const habit = await HabitModel.findOne({
      _id: id,
      userId: (req as AuthRequest).userId
    });
    if (!habit) {
      res.status(404).json({ message: "Habit not found" });
      return;
    }
    const log = await HabitLogModel.findOneAndDelete({
      _id: logId,
      habitId: habit._id
    });
    // 200 with the reward so clients can show XP being taken back.
    const reward = log
      ? await handleHabitLogXP((req as AuthRequest).userId, habit, log)
      : null;
    res.json({ data: { reward } });
  })
);
