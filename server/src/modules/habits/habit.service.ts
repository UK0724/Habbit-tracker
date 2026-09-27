import { userToday } from "./workspaceSync.js";
import { summarize, type Rules } from "./rules.js";
import {
  HabitLogDocument,
  HabitLogModel
} from "../habitLogs/habitLog.model.js";
import { AppError } from "../../utils/appError.js";
import { addDaysToDateString } from "../../utils/date.js";
import {
  GoalDirection,
  HabitDocument,
  HabitModel,
  HabitType
} from "./habit.model.js";

type HabitPayload = {
  userId: string;
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  requireCompletionComment?: boolean;
  linkToJobTracker?: boolean;
  linkToDSAPrep?: boolean;
  linkToExpenseTracker?: boolean;
  color: string;
  goalDirection?: GoalDirection;
  target?: number | null;
  schedule?: "daily" | "weekdays" | "weekly";
  weekdays?: number[];
  timesPerWeek?: number;
  targetMax?: number | null;
  reminderTime?: string;
  ruleHistory?: (Rules & { effectiveDate: string })[];
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
  requireCompletionComment: boolean;
  color: string;
  archived: boolean;
  linkToJobTracker?: boolean;
  linkToDSAPrep?: boolean;
  linkToExpenseTracker?: boolean;
  goalDirection: GoalDirection;
  target?: number | null;
  schedule?: "daily" | "weekdays" | "weekly";
  weekdays?: number[];
  timesPerWeek?: number;
  targetMax?: number | null;
  reminderTime?: string;
  ruleHistory?: (Rules & { effectiveDate: string })[];

  createdAt: string;
  updatedAt: string;
};

export type HabitLogResponse = {
  id: string;
  habitId: string;
  date: string;
  status: "done" | "not_done" | "skipped" | null;
  value: number | null;
  comment?: string;
  createdAt: string;
  updatedAt: string;
};

export type RecentDay = {
  date: string;
  status: "done" | "not_done" | "skipped" | null;
  value: number | null;
  hasLog: boolean;
};

export type HabitListItemResponse = HabitResponse & {
  selectedDateLog: HabitLogResponse | null;
  stats: HabitStats;
  recentDays: RecentDay[];
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
  schedule: habit.schedule ?? "daily",
  weekdays: habit.weekdays ?? [1, 2, 3, 4, 5],
  timesPerWeek: habit.timesPerWeek ?? 3,
  targetMax: habit.targetMax,
  reminderTime: habit.reminderTime,
  ruleHistory: habit.ruleHistory,
  id: habit._id.toString(),
  title: habit.title,
  description: habit.description || undefined,
  type: habit.type,
  unit: habit.unit || undefined,
  requireCompletionComment: Boolean(habit.requireCompletionComment),
  color: habit.color,
  archived: Boolean(habit.archived),
  linkToJobTracker: Boolean(habit.linkToJobTracker),
  linkToDSAPrep: Boolean(habit.linkToDSAPrep),
  linkToExpenseTracker: Boolean(habit.linkToExpenseTracker),
  goalDirection: habit.goalDirection ?? "up",
  target: typeof habit.target === "number" ? habit.target : undefined,
  createdAt: habit.createdAt.toISOString(),
  updatedAt: habit.updatedAt.toISOString()
});

export const serializeHabitLog = (log: HabitLogDocument): HabitLogResponse => ({
  id: log._id.toString(),
  habitId: log.habitId.toString(),
  date: log.date,
  status: log.status,
  value: log.value,
  comment: log.comment || undefined,
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
  logs: HabitLogDocument[],
  today: string
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
      currentStreak: summarize(habit, logs, today, 30).current,
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

/**
 * A trailing window of days ending at `endDate`, filled with each day's log
 * (if any). Powers the "don't break the chain" strip on the daily board.
 */
export const buildRecentDays = (
  logs: HabitLogDocument[],
  endDate: string,
  days = 7
): RecentDay[] => {
  const logByDate = new Map<string, HabitLogDocument>();
  for (const log of logs) {
    if (!logByDate.has(log.date)) {
      logByDate.set(log.date, log);
    }
  }

  const window: RecentDay[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDaysToDateString(endDate, -offset);
    const log = logByDate.get(date);
    window.push({
      date,
      status: log?.status ?? null,
      value: log?.value ?? null,
      hasLog: Boolean(log)
    });
  }

  return window;
};

const getHabitByIdOrThrow = async (id: string, userId: string) => {
  const habit = await HabitModel.findOne({ _id: id, userId });

  if (!habit) {
    throw new AppError("Habit not found", 404);
  }

  return habit;
};

export const listHabits = async (
  userId: string,
  selectedDate?: string,
  includeArchived = false
) => {
  selectedDate ??= await userToday(userId);
  const habits = await HabitModel.find({
    userId,
    ...(includeArchived ? {} : { archived: { $ne: true } })
  }).sort({
    createdAt: 1
  });
  if (habits.length === 0) {
    return [];
  }

  const habitIds = habits.map((habit) => habit._id);
  const today = await userToday(userId);
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
      stats: buildHabitStats(habit, habitLogs, today),
      recentDays: buildRecentDays(habitLogs, selectedDate, 7)
    } satisfies HabitListItemResponse;
  });
};

export const createHabit = async (payload: HabitPayload) => {
  if (
    payload.goalDirection === "range" &&
    (payload.target == null ||
      payload.targetMax == null ||
      payload.targetMax < payload.target)
  )
    throw new AppError("Enter an ordered target range", 400);
  const normalizedDescription = normalizeOptionalString(payload.description);
  const normalizedUnit =
    payload.type === "expense"
      ? (normalizeOptionalString(payload.unit) ?? "₹")
      : normalizeOptionalString(payload.unit);

  ensureHabitConfiguration(payload.type, normalizedUnit);

  const goalDirection: GoalDirection =
    payload.type === "expense"
      ? "down"
      : payload.type === "measurable"
        ? (payload.goalDirection ?? "up")
        : "up";

  const habit = await HabitModel.create({
    ...payload,
    description: normalizedDescription,
    unit: normalizedUnit,
    requireCompletionComment:
      payload.type === "action"
        ? Boolean(payload.requireCompletionComment)
        : false,
    goalDirection,
    target: payload.type === "action" ? undefined : payload.target
  });
  return serializeHabit(habit);
};

export const getHabit = async (id: string, userId: string) => {
  const habit = await getHabitByIdOrThrow(id, userId);
  return serializeHabit(habit);
};

export const listArchivedHabits = async (userId: string) => {
  const habits = await HabitModel.find({ userId, archived: true }).sort({
    updatedAt: -1
  });
  return habits.map(serializeHabit);
};

export const setHabitArchived = async (
  id: string,
  userId: string,
  archived: boolean
) => {
  const habit = await getHabitByIdOrThrow(id, userId);
  habit.archived = archived;
  await habit.save();
  return serializeHabit(habit);
};

export const updateHabit = async (
  id: string,
  userId: string,
  payload: HabitUpdatePayload
) => {
  const habit = await getHabitByIdOrThrow(id, userId);

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

  if (payload.unit && payload.unit !== habit.unit && existingLogsCount > 0)
    throw new AppError(
      "Create a separate habit for a new unit so past measurements keep their meaning",
      409
    );
  const nextUnit =
    nextType === "action"
      ? undefined
      : (normalizeOptionalString(payload.unit) ??
        habit.unit ??
        (nextType === "expense" ? "₹" : undefined));

  ensureHabitConfiguration(nextType, nextUnit);

  const merged = { ...habit.toObject(), ...payload };
  if (
    merged.goalDirection === "range" &&
    (merged.target == null ||
      merged.targetMax == null ||
      merged.targetMax < merged.target)
  )
    throw new AppError("Enter an ordered target range", 400);
  const effectiveDate = await userToday(userId);
  const snapshot = (value: Rules) => ({
    schedule: value.schedule ?? "daily",
    weekdays: value.weekdays,
    timesPerWeek: value.timesPerWeek,
    goalDirection: value.goalDirection,
    target: value.target,
    targetMax: value.targetMax
  });
  habit.ruleHistory = [
    ...(habit.ruleHistory?.length
      ? habit.ruleHistory
      : [{ ...snapshot(habit), effectiveDate: "0001-01-01" }]
    ).filter((r) => r.effectiveDate !== effectiveDate),
    { ...snapshot(merged), effectiveDate }
  ];
  habit.schedule = payload.schedule ?? habit.schedule;
  habit.weekdays = payload.weekdays ?? habit.weekdays;
  habit.timesPerWeek = payload.timesPerWeek ?? habit.timesPerWeek;
  if ("targetMax" in payload) habit.targetMax = payload.targetMax;
  if ("reminderTime" in payload) habit.reminderTime = payload.reminderTime;
  habit.title = payload.title ?? habit.title;
  if ("description" in payload) {
    habit.description = normalizeOptionalString(payload.description);
  }
  habit.type = nextType;
  habit.unit = nextType === "action" ? undefined : nextUnit;
  habit.requireCompletionComment =
    nextType === "action"
      ? (payload.requireCompletionComment ?? habit.requireCompletionComment)
      : false;
  habit.color = payload.color ?? habit.color;
  habit.linkToJobTracker =
    nextType === "action"
      ? (payload.linkToJobTracker ?? habit.linkToJobTracker)
      : false;
  habit.linkToDSAPrep =
    nextType === "action"
      ? (payload.linkToDSAPrep ?? habit.linkToDSAPrep)
      : false;
  habit.linkToExpenseTracker =
    nextType === "action"
      ? (payload.linkToExpenseTracker ?? habit.linkToExpenseTracker)
      : false;
  habit.goalDirection =
    nextType === "expense"
      ? "down"
      : nextType === "action"
        ? "up"
        : (payload.goalDirection ?? habit.goalDirection ?? "up");
  habit.target =
    nextType === "action"
      ? undefined
      : "target" in payload
        ? payload.target
        : habit.target;

  await habit.save();

  return serializeHabit(habit);
};

export const deleteHabit = async (id: string, userId: string) => {
  const habit = await getHabitByIdOrThrow(id, userId);

  await Promise.all([
    habit.deleteOne(),
    HabitLogModel.deleteMany({
      habitId: habit._id
    })
  ]);
};

export const getHabitStats = async (id: string, userId: string) => {
  const habit = await getHabitByIdOrThrow(id, userId);
  const logs = await HabitLogModel.find({
    habitId: habit._id
  }).sort({ date: -1 });

  return buildHabitStats(habit, logs, await userToday(userId));
};
