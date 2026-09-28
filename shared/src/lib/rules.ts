export type Rules = {
  schedule?: "daily" | "weekdays" | "weekly";
  weekdays?: number[];
  timesPerWeek?: number;
  goalDirection?: "up" | "down" | "range" | "record";
  target?: number | null;
  targetMax?: number | null;
};
export type TrackedHabit = Rules & { type: string; createdAt: string | Date; startDate?: string; ruleHistory?: (Rules & { effectiveDate: string })[] };
export type Entry = { date: string; status: string | null; value: number | null };
export const shift = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
export const rulesAt = (habit: TrackedHabit, date: string): Rules =>
  [...(habit.ruleHistory ?? [])].reverse().find(r => r.effectiveDate <= date) ?? habit;
/** First trackable day: the creation day in the user's timezone (startDate), else the UTC creation date for older habits. */
export const startDateOf = (habit: TrackedHabit) =>
  habit.startDate ?? new Date(habit.createdAt).toISOString().slice(0, 10);
export const scheduled = (habit: TrackedHabit, date: string) => {
  if (date < startDateOf(habit)) return false;
  const rules = rulesAt(habit, date);
  return rules.schedule !== "weekdays" || (rules.weekdays ?? []).includes(new Date(`${date}T12:00:00Z`).getUTCDay());
};
export const completed = (habit: TrackedHabit, entry?: Entry) => {
  if (!entry || entry.status === "skipped") return false;
  if (habit.type === "action") return entry.status === "done";
  if (entry.value === null) return false;
  const rules = rulesAt(habit, entry.date);
  if (rules.goalDirection === "record" || rules.target == null) return true;
  if (rules.goalDirection === "range") return entry.value >= rules.target && entry.value <= (rules.targetMax ?? rules.target);
  return rules.goalDirection === "down" ? entry.value <= rules.target : entry.value >= rules.target;
};
export const weekStart = (date: string) => shift(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
export const dayState = (habit: TrackedHabit, entries: Entry[], date: string, today: string) => {
  const entry = entries.find(e => e.date === date);
  if (entry?.status === "skipped") return "skipped";
  if (completed(habit, entry)) return "completed";
  if (!scheduled(habit, date)) return "rest";
  if (rulesAt(habit, date).schedule === "weekly") {
    const start = weekStart(date);
    const count = entries.filter(e => e.date >= start && e.date <= shift(start, 6) && completed(habit, e)).length;
    if (count >= (rulesAt(habit, date).timesPerWeek ?? 1)) return "rest";
    return shift(start, 6) < today ? "missed" : "pending";
  }
  return date < today ? "missed" : "pending";
};
export const summarize = (habit: TrackedHabit, entries: Entry[], today: string, days: number) => {
  const cells = Array.from({ length: days }, (_, i) => {
    const date = shift(today, i - days + 1);
    return { date, state: dayState(habit, entries, date, today), value: entries.find(e => e.date === date)?.value ?? null };
  });
  let due = 0, done = 0;
  const weeks = new Set<string>();
  for (const cell of cells) {
    if (!scheduled(habit, cell.date)) continue;
    const rules = rulesAt(habit, cell.date);
    if (rules.schedule === "weekly") {
      const start = weekStart(cell.date);
      if (weeks.has(start)) continue;
      weeks.add(start);
      if (shift(start, 6) >= today) continue;
      const quota = rules.timesPerWeek ?? 1;
      due += quota;
      done += Math.min(quota, entries.filter(e => e.date >= start && e.date <= shift(start, 6) && completed(habit, e)).length);
    } else if (cell.state !== "skipped" && cell.state !== "rest" && (cell.date < today || cell.state === "completed")) {
      due++;
      if (cell.state === "completed") done++;
    }
  }
  let current = 0, best = 0, run = 0;
  const start = startDateOf(habit);
  const seenWeeks = new Set<string>();
  for (let date = start; date <= today; date = shift(date, 1)) {
    if (!scheduled(habit, date)) continue;
    const rules = rulesAt(habit, date);
    if (rules.schedule === "weekly") {
      const week = weekStart(date);
      if (seenWeeks.has(week)) continue;
      seenWeeks.add(week);
      const success = entries.filter(e => e.date >= week && e.date <= shift(week, 6) && completed(habit, e)).length >= (rules.timesPerWeek ?? 1);
      if (!success && shift(week, 6) >= today) continue;
      run = success ? run + 1 : 0;
    } else {
      const state = dayState(habit, entries, date, today);
      if (state === "skipped" || (date === today && state === "pending")) continue;
      run = state === "completed" ? run + 1 : 0;
    }
    best = Math.max(best, run);
  }
  current = run;
  return { cells, due, done, consistency: due ? Math.round(done / due * 100) : null, current, best };
};
