import { completed, rulesAt } from "@habit-tracker/shared";
import type { Habit, HabitListItem, HabitLog } from "@habit-tracker/shared";
import type { PulseHabitListItem, PulseRecentDay } from "../services/api";
import { formatGoal, formatSchedule, weeklyProgress } from "./format";

/**
 * Plain-text copy for habit list rows (no React Native imports, so it can be
 * checked from node). Information is text, not pills or chips.
 */

type RowHabit = PulseHabitListItem;

/** Row XP hint: "+10 XP" / "+5–15 XP". */
export const rowXpHint = (habit: Pick<Habit, "type">) => (habit.type === "action" ? "+10 XP" : "+5–15 XP");

/**
 * Today's amount against the goal for a measurable habit:
 * "3 / 10 pages", "3 / 4–6 km", "1 / max 2 coffees", "12 km logged".
 */
export const measurableProgress = (habit: Habit, value: number | null, date?: string) => {
  const rules = date ? rulesAt(habit, date) : habit;
  const unit = habit.unit?.trim() ?? "";
  const withUnit = (text: string) => (unit ? `${text} ${unit}` : text);
  const amount = value ?? 0;
  if (rules.goalDirection === "record" || rules.target == null)
    return value == null ? formatGoal(habit, date) : `${withUnit(String(value))} logged`;
  if (rules.goalDirection === "range")
    return withUnit(`${amount} / ${rules.target}–${rules.targetMax ?? rules.target}`);
  if (rules.goalDirection === "down") return withUnit(`${amount} / max ${rules.target}`);
  return withUnit(`${amount} / ${rules.target}`);
};

/** 0–1 progress toward an "at least" goal; null where a ring would mislead. */
export const measurableFraction = (habit: Habit, value: number | null, date?: string) => {
  const rules = date ? rulesAt(habit, date) : habit;
  if (rules.goalDirection === "record" || rules.goalDirection === "down" || rules.goalDirection === "range")
    return null;
  if (rules.target == null || rules.target <= 0) return null;
  return Math.max(0, Math.min(1, (value ?? 0) / rules.target));
};

/** A repaired ("frozen") day inside the recent window protects the streak. */
export const hasFrozenDay = (habit: RowHabit) => ((habit.recentDays ?? []) as PulseRecentDay[]).some((day) => day.frozen);

/**
 * Subtitle parts for a Today row, e.g.
 * ["Daily", "3-day streak ❄️", "+10 XP"], ["0 / 10 pages", "+5–15 XP"],
 * ["2/3 this week", "+10 XP"], ["Skipped today"].
 */
export const todaySubtitle = (habit: RowHabit, log: Pick<HabitLog, "status" | "value"> | null | undefined, date: string) => {
  if (log?.status === "skipped") return ["Skipped today"];
  const parts: string[] = [];
  const weekly = weeklyProgress(habit, habit.recentDays ?? [], date);
  const frozen = hasFrozenDay(habit) ? " ❄️" : "";
  if (habit.type === "action") {
    const streak = habit.stats?.type === "action" ? habit.stats.currentStreak : 0;
    parts.push(weekly ? `${weekly.done}/${weekly.target} this week` : formatSchedule(habit));
    if (streak > 0) parts.push(`${streak}-${weekly ? "week" : "day"} streak${frozen}`);
  } else {
    parts.push(measurableProgress(habit, log?.value ?? null, date));
    if (weekly) parts.push(`${weekly.done}/${weekly.target} this week`);
  }
  if (habit.requireCompletionComment && !completed(habit, (log ?? undefined) as HabitLog | undefined))
    parts.push("Note needed");
  parts.push(rowXpHint(habit));
  return parts;
};

/** Subtitle for the Habits tab: "At least 10 pages · Daily", "Check off · Mon–Fri · 3-day streak". */
export const librarySubtitle = (habit: HabitListItem, date: string) => {
  const parts: string[] = [];
  if (habit.type === "measurable") parts.push(formatGoal(habit, date));
  else if (habit.type === "expense") parts.push("Expense");
  else parts.push("Check off");
  parts.push(formatSchedule(habit));
  const streak = habit.type === "action" && habit.stats?.type === "action" ? habit.stats.currentStreak : 0;
  if (streak > 0) parts.push(`${streak}-${habit.schedule === "weekly" ? "week" : "day"} streak`);
  return parts;
};
