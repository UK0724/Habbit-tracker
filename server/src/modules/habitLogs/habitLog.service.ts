import { HabitModel } from "../habits/habit.model.js";
import {
  serializeHabit,
  serializeHabitLog
} from "../habits/habit.service.js";
import { AppError } from "../../utils/appError.js";
import { getTodayDateString } from "../../utils/date.js";
import {
  HabitLogDocument,
  HabitLogModel
} from "./habitLog.model.js";

type HabitLogPayload = {
  date?: string;
  status?: "done" | "not_done" | null;
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
  habit: { type: "action" | "measurable"; requireCompletionComment: boolean },
  payload: HabitLogPayload,
  currentLog?: HabitLogDocument
) => {
  const nextDate = payload.date ?? currentLog?.date;
  const nextStatus =
    payload.status !== undefined ? payload.status : currentLog?.status ?? null;
  const nextValue =
    payload.value !== undefined ? payload.value : currentLog?.value ?? null;
  const nextComment =
    payload.comment !== undefined
      ? normalizeOptionalString(payload.comment)
      : currentLog?.comment;

  if (!nextDate) {
    throw new AppError("Date is required", 400);
  }

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
      comment: nextStatus === "done" ? nextComment : undefined
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
    comment: undefined
  };
};

const normalizeOptionalString = (value?: string) => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
};

export const listHabitLogs = async (habitId: string, userId: string, limit = 10) => {
  await getHabitByIdOrThrow(habitId, userId);

  const logs = await HabitLogModel.find({
    habitId
  })
    .sort({ date: -1 })
    .limit(limit);

  return logs.map(serializeHabitLog);
};

export const createHabitLog = async (habitId: string, userId: string, payload: HabitLogPayload) => {
  const habit = await getHabitByIdOrThrow(habitId, userId);
  const normalizedPayload = normalizePayloadForHabit(habit, payload);

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

  return serializeHabitLog(log);
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

  log.date = normalizedPayload.date;
  log.status = normalizedPayload.status;
  log.value = normalizedPayload.value;
  log.comment = normalizedPayload.comment;

  await log.save();

  return serializeHabitLog(log);
};

export const getTodayLogs = async (userId: string) => {
  const today = getTodayDateString();

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
