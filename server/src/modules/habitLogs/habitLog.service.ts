import { userToday } from "../habits/workspaceSync.js";
import { HabitModel } from "../habits/habit.model.js";
import { serializeHabit, serializeHabitLog } from "../habits/habit.service.js";
import { AppError } from "../../utils/appError.js";
import { handleHabitLogXP } from "../gamification/gamification.service.js";

import { HabitLogDocument, HabitLogModel } from "./habitLog.model.js";

type HabitLogPayload = {
  date?: string;
  status?: "done" | "not_done" | "skipped" | null;
  value?: number | null;
  comment?: string;
};

const getHabitByIdOrThrow = async (habitId: string, userId: string) => {
  const habit = await HabitModel.findOne({ _id: habitId, userId });

  if (!habit) {
    throw new AppError("Habit not found", 404);
  }

  return habit;
};

const normalizePayloadForHabit = (
  habit: {
    type: "action" | "measurable" | "expense";
    requireCompletionComment: boolean;
  },
  payload: HabitLogPayload,
  currentLog?: HabitLogDocument
) => {
  const nextDate = payload.date ?? currentLog?.date;
  const nextStatus =
    payload.status !== undefined
      ? payload.status
      : (currentLog?.status ?? null);
  const nextValue =
    payload.value !== undefined ? payload.value : (currentLog?.value ?? null);
  const nextComment =
    payload.comment !== undefined
      ? normalizeOptionalString(payload.comment)
      : currentLog?.comment;

  if (!nextDate) {
    throw new AppError("Date is required", 400);
  }

  if (nextStatus === "skipped")
    return {
      date: nextDate,
      status: "skipped" as const,
      value: null,
      comment: nextComment
    };

  if (habit.type === "action") {
    if (payload.value !== undefined && payload.value !== null) {
      throw new AppError("Action logs must use status, not value", 400);
    }

    if (nextStatus !== "done" && nextStatus !== "not_done") {
      throw new AppError("Action logs must include a valid status", 400);
    }

    if (
      habit.requireCompletionComment &&
      nextStatus === "done" &&
      !nextComment
    ) {
      throw new AppError("Add a comment before marking this habit done", 400);
    }

    return {
      date: nextDate,
      status: nextStatus,
      value: null,
      comment: nextComment
    };
  }

  if (payload.status !== undefined && payload.status !== null) {
    throw new AppError("Measurable logs must use value, not status", 400);
  }

  if (typeof nextValue !== "number" || Number.isNaN(nextValue)) {
    throw new AppError("Measurable logs must include a numeric value", 400);
  }

  return {
    date: nextDate,
    status: null,
    value: nextValue,
    comment: nextComment
  };
};

const normalizeOptionalString = (value?: string) => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
};

export const listHabitLogs = async (
  habitId: string,
  userId: string,
  limit = 10
) => {
  await getHabitByIdOrThrow(habitId, userId);

  const logs = await HabitLogModel.find({
    habitId
  })
    .sort({ date: -1 })
    .limit(limit);

  return logs.map(serializeHabitLog);
};

/** Excusing a past day keeps a streak alive, so it goes through a paid streak repair. */
const PAST_SKIP_MESSAGE =
  "Only today can be skipped. Use a streak repair to excuse a missed day.";

export const createHabitLog = async (
  habitId: string,
  userId: string,
  payload: HabitLogPayload
) => {
  const habit = await getHabitByIdOrThrow(habitId, userId);
  const today = await userToday(userId);
  if (payload.date && payload.date > today)
    throw new AppError("Future check-ins are not available", 400);
  const normalizedPayload = normalizePayloadForHabit(habit, payload);
  if (normalizedPayload.status === "skipped" && normalizedPayload.date < today)
    throw new AppError(PAST_SKIP_MESSAGE, 400);

  const existingLog = await HabitLogModel.findOne({
    habitId: habit._id,
    date: normalizedPayload.date
  });

  if (existingLog) {
    throw new AppError("A log already exists for this habit and date", 409);
  }

  const log = await HabitLogModel.create({
    habitId: habit._id,
    ...normalizedPayload
  });

  const reward = await handleHabitLogXP(userId, habit, undefined, log);

  return { ...serializeHabitLog(log), reward };
};

export const updateHabitLog = async (
  habitId: string,
  logId: string,
  userId: string,
  payload: HabitLogPayload
) => {
  const habit = await getHabitByIdOrThrow(habitId, userId);
  const log = await HabitLogModel.findOne({
    _id: logId,
    habitId: habit._id
  });

  if (!log) {
    throw new AppError("Habit log not found", 404);
  }

  const normalizedPayload = normalizePayloadForHabit(habit, payload, log);
  const today = await userToday(userId);
  if (normalizedPayload.date > today)
    throw new AppError("Future check-ins are not available", 400);
  // Editing an already-excused day (e.g. its note) stays allowed.
  if (
    normalizedPayload.status === "skipped" &&
    normalizedPayload.date < today &&
    !(log.status === "skipped" && log.date === normalizedPayload.date)
  )
    throw new AppError(PAST_SKIP_MESSAGE, 400);
  const updated = await HabitLogModel.findOneAndUpdate(
    {
      _id: log._id,
      habitId: habit._id,
      updatedAt: log.updatedAt,
      status: log.status,
      value: log.value,
      date: log.date
    },
    {
      $set: normalizedPayload,
      ...(normalizedPayload.comment === undefined
        ? { $unset: { comment: 1 } }
        : {})
    },
    { new: true, runValidators: true }
  );
  if (!updated)
    throw new AppError("This log changed. Refresh and try again.", 409);
  const reward = await handleHabitLogXP(userId, habit, log, updated);
  return { ...serializeHabitLog(updated), reward };
};

export const getTodayLogs = async (userId: string) => {
  const today = await userToday(userId);

  const userHabits = await HabitModel.find({ userId }).select("_id");
  const userHabitIds = userHabits.map((h) => h._id);

  const logs = await HabitLogModel.find({
    date: today,
    habitId: { $in: userHabitIds }
  }).sort({ createdAt: 1 });

  if (logs.length === 0) {
    return [];
  }

  const habitIds = [...new Set(logs.map((log) => log.habitId.toString()))];
  const habits = await HabitModel.find({
    _id: {
      $in: habitIds
    }
  });

  const habitsById = new Map(
    habits.map((habit) => [habit._id.toString(), serializeHabit(habit)])
  );

  return logs.map((log) => ({
    ...serializeHabitLog(log),
    habit: habitsById.get(log.habitId.toString()) ?? null
  }));
};

