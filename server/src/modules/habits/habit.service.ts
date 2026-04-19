import { HabitLogDocument, HabitLogModel } from "../habitLogs/habitLog.model.js";
import { AppError } from "../../utils/appError.js";
import { addDaysToDateString, getTodayDateString } from "../../utils/date.js";
import {
  HabitDocument,
  HabitModel,
  HabitType
} from "./habit.model.js";

type HabitPayload = {
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  color: string;
};

type HabitUpdatePayload = Partial<HabitPayload>;

type ActionHabitStats = {
  type: "action";
  currentStreak: number;
  lastCompletedDate: string | null;
};

type MeasurableTrend = "up" | "down" | "same" | "none";

type MeasurableHabitStats = {
  type: "measurable";
  latestValue: number | null;
  previousValue: number | null;
  trend: MeasurableTrend;
  difference: number | null;
  differenceLabel: string | null;
};

export type HabitStats = ActionHabitStats | MeasurableHabitStats;

export type HabitResponse = {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type HabitLogResponse = {
  id: string;
  habitId: string;
  date: string;
  status: "done" | "not_done" | null;
  value: number | null;
  createdAt: string;
  updatedAt: string;
};

export type HabitListItemResponse = HabitResponse & {
  selectedDateLog: HabitLogResponse | null;
  stats: HabitStats;
};

const currencyLikeUnits = new Set(["₹", "$", "€", "£", "¥"]);

const normalizeOptionalString = (value?: string) => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2
  }).format(value);

const formatDifferenceLabel = (difference: number, unit?: string) => {
  if (difference === 0) {
    return "same as previous entry";
  }

  const absoluteValue = formatNumber(Math.abs(difference));

  if (!unit) {
    return `${difference > 0 ? "+" : "-"}${absoluteValue}`;
  }

  if (currencyLikeUnits.has(unit)) {
    return `${difference > 0 ? "+" : "-"}${unit}${absoluteValue}`;
  }

  return `${difference > 0 ? "+" : "-"}${absoluteValue} ${unit}`;
};

const roundDifference = (value: number) => Number(value.toFixed(2));

export const serializeHabit = (habit: HabitDocument): HabitResponse => ({
  id: habit._id.toString(),
  title: habit.title,
  description: habit.description || undefined,
  type: habit.type,
  unit: habit.unit || undefined,
  color: habit.color,
  createdAt: habit.createdAt.toISOString(),
  updatedAt: habit.updatedAt.toISOString()
});

export const serializeHabitLog = (log: HabitLogDocument): HabitLogResponse => ({
  id: log._id.toString(),
  habitId: log.habitId.toString(),
  date: log.date,
  status: log.status,
  value: log.value,
  createdAt: log.createdAt.toISOString(),
  updatedAt: log.updatedAt.toISOString()
});

const ensureHabitConfiguration = (type: HabitType, unit?: string) => {
  if (type === "measurable" && !unit) {
    throw new AppError("Unit is required for measurable habits", 400);
  }

  if (type === "action" && unit) {
    throw new AppError("Action habits cannot define a unit", 400);
  }
};

export const buildHabitStats = (
  habit: HabitDocument,
  logs: HabitLogDocument[]
): HabitStats => {
  if (habit.type === "action") {
    const sortedLogs = [...logs].sort((left, right) =>
      right.date.localeCompare(left.date)
    );

    const lastCompletedDate =
      sortedLogs.find((log) => log.status === "done")?.date ?? null;

    let currentStreak = 0;
    let previousDate: string | null = null;

    for (const log of sortedLogs) {
      if (currentStreak === 0) {
        if (log.status !== "done") {
          break;
        }

        currentStreak = 1;
        previousDate = log.date;
        continue;
      }

      const expectedDate = addDaysToDateString(previousDate as string, -1);

      if (log.status !== "done" || log.date !== expectedDate) {
        break;
      }

      currentStreak += 1;
      previousDate = log.date;
    }

    return {
      type: "action",
      currentStreak,
      lastCompletedDate
    };
  }

  const measurableLogs = [...logs]
    .filter((log) => typeof log.value === "number")
    .sort((left, right) => right.date.localeCompare(left.date));

  const latestValue = measurableLogs[0]?.value ?? null;
  const previousValue = measurableLogs[1]?.value ?? null;

  if (latestValue === null) {
    return {
      type: "measurable",
      latestValue: null,
      previousValue: null,
      trend: "none",
      difference: null,
      differenceLabel: null
    };
  }

  if (previousValue === null) {
    return {
      type: "measurable",
      latestValue,
      previousValue: null,
      trend: "none",
      difference: null,
      differenceLabel: null
    };
  }

  const difference = roundDifference(latestValue - previousValue);

  return {
    type: "measurable",
    latestValue,
    previousValue,
    trend: difference > 0 ? "up" : difference < 0 ? "down" : "same",
    difference,
    differenceLabel: formatDifferenceLabel(difference, habit.unit)
  };
};

const getHabitByIdOrThrow = async (id: string) => {
  const habit = await HabitModel.findById(id);

  if (!habit) {
    throw new AppError("Habit not found", 404);
  }

  return habit;
};

export const listHabits = async (selectedDate = getTodayDateString()) => {
  const habits = await HabitModel.find().sort({ createdAt: 1 });

  if (habits.length === 0) {
    return [];
  }

  const habitIds = habits.map((habit) => habit._id);
  const logs = await HabitLogModel.find({
    habitId: {
      $in: habitIds
    }
  }).sort({ date: -1 });

  const logsByHabit = new Map<string, HabitLogDocument[]>();
  const selectedLogByHabit = new Map<string, HabitLogDocument>();

  for (const log of logs) {
    const key = log.habitId.toString();
    const currentLogs = logsByHabit.get(key) ?? [];
    currentLogs.push(log);
    logsByHabit.set(key, currentLogs);

    if (log.date === selectedDate && !selectedLogByHabit.has(key)) {
      selectedLogByHabit.set(key, log);
    }
  }

  return habits.map((habit) => {
    const habitLogs = logsByHabit.get(habit._id.toString()) ?? [];

    return {
      ...serializeHabit(habit),
      selectedDateLog: selectedLogByHabit.has(habit._id.toString())
        ? serializeHabitLog(selectedLogByHabit.get(habit._id.toString())!)
        : null,
      stats: buildHabitStats(habit, habitLogs)
    } satisfies HabitListItemResponse;
  });
};

export const createHabit = async (payload: HabitPayload) => {
  const normalizedDescription = normalizeOptionalString(payload.description);
  const normalizedUnit = normalizeOptionalString(payload.unit);

  ensureHabitConfiguration(payload.type, normalizedUnit);

  const habit = await HabitModel.create({
    ...payload,
    description: normalizedDescription,
    unit: normalizedUnit
  });
  return serializeHabit(habit);
};

export const getHabit = async (id: string) => {
  const habit = await getHabitByIdOrThrow(id);
  return serializeHabit(habit);
};

export const updateHabit = async (id: string, payload: HabitUpdatePayload) => {
  const habit = await getHabitByIdOrThrow(id);

  const nextType = payload.type ?? habit.type;
  const existingLogsCount = await HabitLogModel.countDocuments({
    habitId: habit._id
  });

  if (payload.type && payload.type !== habit.type && existingLogsCount > 0) {
    throw new AppError(
      "Habit type cannot be changed after logs have been created",
      409
    );
  }

  const nextUnit =
    nextType === "action"
      ? undefined
      : normalizeOptionalString(payload.unit) ?? habit.unit;

  ensureHabitConfiguration(nextType, nextUnit);

  habit.title = payload.title ?? habit.title;
  if ("description" in payload) {
    habit.description = normalizeOptionalString(payload.description);
  }
  habit.type = nextType;
  habit.unit = nextType === "action" ? undefined : nextUnit;
  habit.color = payload.color ?? habit.color;

  await habit.save();

  return serializeHabit(habit);
};

export const deleteHabit = async (id: string) => {
  const habit = await getHabitByIdOrThrow(id);

  await Promise.all([
    habit.deleteOne(),
    HabitLogModel.deleteMany({
      habitId: habit._id
    })
  ]);
};

export const getHabitStats = async (id: string) => {
  const habit = await getHabitByIdOrThrow(id);
  const logs = await HabitLogModel.find({
    habitId: habit._id
  }).sort({ date: -1 });

  return buildHabitStats(habit, logs);
};
