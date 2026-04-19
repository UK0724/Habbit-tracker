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
};

const getHabitByIdOrThrow = async (habitId: string) => {
  const habit = await HabitModel.findById(habitId);

  if (!habit) {
    throw new AppError("Habit not found", 404);
  }

  return habit;
};

const normalizePayloadForHabit = (
  type: "action" | "measurable",
  payload: HabitLogPayload,
  currentLog?: HabitLogDocument
) => {
  const nextDate = payload.date ?? currentLog?.date;
  const nextStatus =
    payload.status !== undefined ? payload.status : currentLog?.status ?? null;
  const nextValue =
    payload.value !== undefined ? payload.value : currentLog?.value ?? null;

  if (!nextDate) {
    throw new AppError("Date is required", 400);
  }

  if (type === "action") {
    if (payload.value !== undefined && payload.value !== null) {
      throw new AppError("Action logs must use status, not value", 400);
    }

    if (nextStatus !== "done" && nextStatus !== "not_done") {
      throw new AppError("Action logs must include a valid status", 400);
    }

    return {
      date: nextDate,
      status: nextStatus,
      value: null
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
    value: nextValue
  };
};

export const listHabitLogs = async (habitId: string, limit = 10) => {
  await getHabitByIdOrThrow(habitId);

  const logs = await HabitLogModel.find({
    habitId
  })
    .sort({ date: -1 })
    .limit(limit);

  return logs.map(serializeHabitLog);
};

export const createHabitLog = async (habitId: string, payload: HabitLogPayload) => {
  const habit = await getHabitByIdOrThrow(habitId);
  const normalizedPayload = normalizePayloadForHabit(habit.type, payload);

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
  payload: HabitLogPayload
) => {
  const habit = await getHabitByIdOrThrow(habitId);
  const log = await HabitLogModel.findOne({
    _id: logId,
    habitId: habit._id
  });

  if (!log) {
    throw new AppError("Habit log not found", 404);
  }

  const normalizedPayload = normalizePayloadForHabit(habit.type, payload, log);

  log.date = normalizedPayload.date;
  log.status = normalizedPayload.status;
  log.value = normalizedPayload.value;

  await log.save();

  return serializeHabitLog(log);
};

export const getTodayLogs = async () => {
  const today = getTodayDateString();
  const logs = await HabitLogModel.find({
    date: today
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
