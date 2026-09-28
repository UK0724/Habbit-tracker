import { completed, rulesAt, weekStart } from "@habit-tracker/shared";
import type { Habit, RecentDay } from "@habit-tracker/shared";

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Readable schedule: "Daily", "Mon–Fri", "Weekends", "Mon, Wed, Fri", "3× / week". */
export const formatSchedule = (habit: Pick<Habit, "schedule" | "weekdays" | "timesPerWeek">) => {
  if (habit.schedule === "weekly") {
    const times = habit.timesPerWeek ?? 1;
    return times === 1 ? "Once a week" : `${times}× / week`;
  }
  if (habit.schedule !== "weekdays") return "Daily";
  const days = [...new Set(habit.weekdays ?? [])].sort((a, b) => a - b);
  if (days.length === 0) return "No days set";
  if (days.length === 7) return "Daily";
  if (days.join() === "1,2,3,4,5") return "Mon–Fri";
  if (days.join() === "0,6") return "Weekends";
  // Consecutive runs of 3+ read better as a range.
  const consecutive = days.every((day, index) => index === 0 || day === days[index - 1] + 1);
  if (consecutive && days.length >= 3)
    return `${DAY_NAMES[days[0]]}–${DAY_NAMES[days[days.length - 1]]}`;
  return days.map((day) => DAY_NAMES[day]).join(", ");
};

/** Goal label that never renders an empty target ("Target:  km"). */
export const formatGoal = (habit: Habit, date?: string) => {
  if (habit.type === "action") return "Check off when done";
  if (habit.type === "expense") return "Expense tracking";
  const rules = date ? rulesAt(habit, date) : habit;
  const unit = habit.unit?.trim() ?? "";
  const withUnit = (value: string) => (unit ? `${value} ${unit}` : value);
  if (rules.goalDirection === "record" || rules.target == null)
    return unit ? `Record ${unit}` : "Record a value";
  if (rules.goalDirection === "range")
    return withUnit(`${rules.target}–${rules.targetMax ?? rules.target}`);
  return `${rules.goalDirection === "down" ? "At most" : "At least"} ${withUnit(String(rules.target))}`;
};

/** XP hint shown on a habit card. */
export const xpHint = (habit: Pick<Habit, "type">) =>
  habit.type === "action" ? "+10 XP" : "5–15 XP";

/** Completed entries this week (Mon-based) for weekly habits, from the 7-day window. */
export const weeklyProgress = (habit: Habit, recentDays: RecentDay[], today: string) => {
  if (habit.schedule !== "weekly") return null;
  const start = weekStart(today);
  const done = recentDays.filter(
    (day) => day.date >= start && day.date <= today && completed(habit, day)
  ).length;
  return { done, target: habit.timesPerWeek ?? 1 };
};

const THOUSANDS = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/;
const DECIMAL_COMMA = /^-?\d*,\d+$/;
const PLAIN_NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

/**
 * Parse a user-typed number; rejects blanks and anything ambiguous.
 * "10,000" and "1,234.5" are thousands groups (10000, 1234.5); a lone
 * comma otherwise is a decimal separator ("1,5" -> 1.5).
 */
export const parseNumberInput = (raw: string): number | null => {
  let text = raw.trim();
  if (!text) return null;
  if (THOUSANDS.test(text)) text = text.replace(/,/g, "");
  else if (DECIMAL_COMMA.test(text)) text = text.replace(",", ".");
  if (!PLAIN_NUMBER.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};
