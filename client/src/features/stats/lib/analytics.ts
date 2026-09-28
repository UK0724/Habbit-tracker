import { summarize, type TrackedHabit } from "../../../shared/lib/rules";
import {
  addDaysToDateString,
  getTodayDateString
} from "../../../shared/lib/date";
import type { ActionStatus, HabitLog } from "../../../shared/types/habit";

export type DayCell = {
  date: string;
  status: ActionStatus | null;
  value: number | null;
  hasLog: boolean;
  frozen?: boolean;
};

export type ActionAnalytics = {
  type: "action";
  currentStreak: number;
  longestStreak: number;
  totalDone: number;
  totalLogged: number;
  completionRate: number; // 0..1 over logged days
  last7: DayCell[];
  last30Done: number;
  lastCompletedDate: string | null;
};

export type MeasurableAnalytics = {
  type: "measurable";
  series: { date: string; value: number }[]; // oldest -> newest
  latest: number | null;
  previous: number | null;
  min: number | null;
  max: number | null;
  average: number | null;
  total: number;
  entries: number;
  trend: "up" | "down" | "same" | "none";
};

/** Build an inclusive list of date strings ending today (oldest first). */
export const buildDateWindow = (
  days: number,
  endDate: string = getTodayDateString()
): string[] => {
  const window: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    window.push(addDaysToDateString(endDate, -offset));
  }
  return window;
};

const indexLogsByDate = (logs: HabitLog[]) => {
  const byDate = new Map<string, HabitLog>();
  for (const log of logs) {
    // Logs arrive newest-first; keep the first (freshest) per date.
    if (!byDate.has(log.date)) {
      byDate.set(log.date, log);
    }
  }
  return byDate;
};

/** Longest run of consecutive calendar days marked "done". */
const computeLongestStreak = (doneDates: string[]) => {
  if (doneDates.length === 0) {
    return 0;
  }

  const sorted = [...doneDates].sort((a, b) => a.localeCompare(b));
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const expected = addDaysToDateString(sorted[i - 1]!, 1);
    run = sorted[i] === expected ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  return longest;
};

/**
 * Current streak: consecutive "done" days ending at the most recent
 * completion. Mirrors the server so the two never disagree.
 */
const computeCurrentStreak = (doneDates: string[]) => {
  if (doneDates.length === 0) {
    return 0;
  }

  const sorted = [...doneDates].sort((a, b) => b.localeCompare(a));
  if (sorted[0]! < addDaysToDateString(getTodayDateString(),-1)) return 0;
  let streak = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const expected = addDaysToDateString(sorted[i - 1]!, -1);
    if (sorted[i] !== expected) {
      break;
    }
    streak += 1;
  }

  return streak;
};

export const buildActionAnalytics = (logs: HabitLog[], habit?: TrackedHabit): ActionAnalytics => {
  const summary = habit ? summarize(habit, logs, getTodayDateString(),180) : null;
  const byDate = indexLogsByDate(logs);
  const today = getTodayDateString();

  const doneDates: string[] = [];
  let totalLogged = 0;

  for (const log of byDate.values()) {
    totalLogged += 1;
    if (log.status === "done") {
      doneDates.push(log.date);
    }
  }

  const last7: DayCell[] = buildDateWindow(7, today).map((date) => {
    const log = byDate.get(date);
    return {
      date,
      status: log?.status ?? null,
      value: null,
      hasLog: Boolean(log)
    };
  });

  const last30 = buildDateWindow(30, today);
  const last30Done = last30.filter(
    (date) => byDate.get(date)?.status === "done"
  ).length;

  const lastCompletedDate =
    doneDates.length > 0
      ? [...doneDates].sort((a, b) => b.localeCompare(a))[0] ?? null
      : null;

  return {
    type: "action",
    currentStreak: summary?.current ?? computeCurrentStreak(doneDates),
    longestStreak: summary?.best ?? computeLongestStreak(doneDates),
    totalDone: doneDates.length,
    totalLogged,
    completionRate: summary ? (summary.consistency ?? 0)/100 : totalLogged === 0 ? 0 : doneDates.length / totalLogged,
    last7,
    last30Done,
    lastCompletedDate
  };
};

export const buildMeasurableAnalytics = (
  logs: HabitLog[]
): MeasurableAnalytics => {
  const values = logs
    .filter((log) => typeof log.value === "number")
    .map((log) => ({ date: log.date, value: log.value as number }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (values.length === 0) {
    return {
      type: "measurable",
      series: [],
      latest: null,
      previous: null,
      min: null,
      max: null,
      average: null,
      total: 0,
      entries: 0,
      trend: "none"
    };
  }

  const numbers = values.map((point) => point.value);
  const latest = numbers[numbers.length - 1]!;
  const previous = numbers.length > 1 ? numbers[numbers.length - 2]! : null;
  const total = numbers.reduce((sum, value) => sum + value, 0);

  const trend =
    previous === null
      ? "none"
      : latest > previous
        ? "up"
        : latest < previous
          ? "down"
          : "same";

  return {
    type: "measurable",
    series: values,
    latest,
    previous,
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    average: total / numbers.length,
    total,
    entries: numbers.length,
    trend
  };
};

/**
 * Build a contribution heatmap grid (like GitHub): full weeks (columns),
 * each with 7 day cells (rows), covering the trailing `weeks` weeks.
 * Returns columns oldest -> newest, each column top (Sun) -> bottom (Sat).
 */
export const buildContributionGrid = (logs: HabitLog[], weeks = 18) => {
  const byDate = indexLogsByDate(logs);
  const today = getTodayDateString();

  // Find the most recent Saturday (end of current week) so columns align.
  const [y = 0, m = 1, d = 1] = today.split("-").map(Number);
  const todayDow = new Date(y, m - 1, d).getDay(); // 0 = Sun .. 6 = Sat
  const endDate = addDaysToDateString(today, 6 - todayDow);

  const totalDays = weeks * 7;
  const startDate = addDaysToDateString(endDate, -(totalDays - 1));

  const columns: DayCell[][] = [];
  for (let w = 0; w < weeks; w += 1) {
    const column: DayCell[] = [];
    for (let dow = 0; dow < 7; dow += 1) {
      const date = addDaysToDateString(startDate, w * 7 + dow);
      const log = byDate.get(date);
      column.push({
        date,
        status: log?.status ?? null,
        value: log?.value ?? null,
        hasLog: Boolean(log),
        frozen: log?.frozen === true
      });
    }
    columns.push(column);
  }

  return { columns, startDate, endDate };
};
