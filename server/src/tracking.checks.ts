import assert from "node:assert/strict";
import {
  completed,
  dayState,
  summarize,
  rulesAt,
  type TrackedHabit
} from "./modules/habits/rules.js";
import {
  createHabitBodySchema,
  updateHabitBodySchema
} from "./modules/habits/habit.validation.js";
const habit: TrackedHabit = {
  type: "action",
  createdAt: "2026-09-01",
  schedule: "daily"
};
const done = (date: string) => ({ date, status: "done", value: null });
assert.equal(dayState(habit, [], "2026-09-14", "2026-09-14"), "pending");
assert.equal(dayState(habit, [], "2026-09-13", "2026-09-14"), "missed");
assert.equal(
  dayState(
    habit,
    [{ date: "2026-09-13", status: "skipped", value: null }],
    "2026-09-13",
    "2026-09-14"
  ),
  "skipped"
);
const weekdays = {
  ...habit,
  schedule: "weekdays" as const,
  weekdays: [1, 3, 5]
};
assert.equal(dayState(weekdays, [], "2026-09-12", "2026-09-14"), "rest");
assert.equal(
  summarize(weekdays, [done("2026-09-09"), done("2026-09-11")], "2026-09-14", 7)
    .current,
  2
);
assert.equal(
  summarize(habit, [done("2026-09-01"), done("2026-09-02")], "2026-09-14", 30)
    .current,
  0
);
assert.equal(
  summarize(
    habit,
    [
      done("2026-09-12"),
      { date: "2026-09-13", status: "skipped", value: null }
    ],
    "2026-09-14",
    7
  ).current,
  1
);
const weekly = { ...habit, schedule: "weekly" as const, timesPerWeek: 2 };
assert.equal(dayState(weekly, [], "2026-09-14", "2026-09-14"), "pending");
assert.equal(
  dayState(
    weekly,
    [done("2026-09-15"), done("2026-09-16")],
    "2026-09-17",
    "2026-09-17"
  ),
  "rest"
);
assert.equal(
  dayState(
    weekly,
    [{ date: "2026-09-17", status: "skipped", value: null }],
    "2026-09-17",
    "2026-09-17"
  ),
  "skipped"
);
assert.equal(
  summarize(weekly, [done("2026-09-08"), done("2026-09-11")], "2026-09-14", 7)
    .consistency,
  100
);
assert.equal(
  summarize(weekly, [done("2026-09-08"), done("2026-09-11")], "2026-09-14", 7)
    .current,
  1
);
const measured = {
  ...habit,
  type: "measurable",
  target: 10,
  goalDirection: "up" as const
};
for (const [value, expected] of [[9, false], [10, true], [11, true], [12, true], [13, false]] as const) {
  assert.equal(
    completed(
      { ...measured, goalDirection: "range", targetMax: 12 },
      { date: "2026-09-14", status: null, value }
    ),
    expected,
    `Range completion must include both boundaries: ${value}`
  );
}
assert.equal(
  completed(measured, { date: "2026-09-14", status: null, value: 9 }),
  false
);
assert.equal(
  completed(
    { ...measured, goalDirection: "down" },
    { date: "2026-09-14", status: null, value: 0 }
  ),
  true
);
assert.equal(
  completed(
    { ...measured, goalDirection: "range", targetMax: 12 },
    { date: "2026-09-14", status: null, value: 13 }
  ),
  false
);
assert.equal(
  completed(
    { ...measured, goalDirection: "record" },
    { date: "2026-09-14", status: null, value: 0 }
  ),
  true
);
assert.equal(
  completed(
    { ...measured, goalDirection: "record" },
    { date: "2026-09-14", status: null, value: null }
  ),
  false
);
const edited = {
  ...measured,
  target: 20,
  ruleHistory: [
    { effectiveDate: "0001-01-01", target: 10, goalDirection: "up" as const },
    { effectiveDate: "2026-09-14", target: 20, goalDirection: "up" as const }
  ]
};
assert.equal(
  completed(edited, { date: "2026-09-13", status: null, value: 10 }),
  true
);
assert.equal(
  completed(edited, { date: "2026-09-14", status: null, value: 10 }),
  false
);
assert.equal(rulesAt(edited, "2026-09-13").target, 10);
assert.throws(() =>
  createHabitBodySchema.parse({
    title: "Test",
    type: "action",
    color: "violet",
    timesPerWeek: 8
  })
);
assert.throws(() => updateHabitBodySchema.parse({ weekdays: [] }));
assert.throws(() => updateHabitBodySchema.parse({ reminderTime: "25:99" }));
console.log(
  "Tracking rules: scheduling, streaks, skips, zero values, ranges, historical edits and validation passed."
);
