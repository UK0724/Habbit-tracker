const assert = require("node:assert/strict");
const fs = require("node:fs");
// Pin the zone so the wall-clock assertions are stable; switched later to
// simulate a device timezone change.
process.env.TZ = "Asia/Kolkata";
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(
  path.join(__dirname, "../src/services/notifications.ts"),
  "utf8"
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

const scheduled = new Map([["unrelated", { identifier: "unrelated" }]]);
const calls = [];
let permission = "granted";
let responseListener = null;
let lastResponse = null;
const presented = new Map();
const notifications = {
  SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly", DATE: "date" },
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: () => undefined,
  setNotificationChannelAsync: async () => calls.push("channel"),
  getPermissionsAsync: async () => {
    calls.push("permission");
    return { status: permission };
  },
  requestPermissionsAsync: async () => ({ status: permission }),
  getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
  cancelScheduledNotificationAsync: async (id) => scheduled.delete(id),
  scheduleNotificationAsync: async (request) => {
    scheduled.set(request.identifier, request);
    return request.identifier;
  },
  getPresentedNotificationsAsync: async () =>
    [...presented.keys()].map((identifier) => ({ request: { identifier } })),
  dismissNotificationAsync: async (id) => presented.delete(id),
  getLastNotificationResponseAsync: async () => lastResponse,
  addNotificationResponseReceivedListener: (listener) => {
    responseListener = listener;
    return { remove: () => (responseListener = null) };
  }
};
const moduleObject = { exports: {} };
vm.runInNewContext(compiled, {
  module: moduleObject,
  exports: moduleObject.exports,
  require: (name) => {
    if (name === "expo-notifications") return notifications;
    if (name === "react-native") return { Platform: { OS: "android" } };
    throw new Error(`Unexpected import: ${name}`);
  },
  console,
  Date
});

const {
  requestNotificationPermissions,
  syncHabitReminders,
  clearHabitReminders,
  subscribeToReminderTaps,
  REMINDER_HORIZON_DAYS,
  MAX_SCHEDULED_REMINDERS
} = moduleObject.exports;
const habit = (id, overrides = {}) => ({
  id,
  title: `Habit ${id}`,
  type: "action",
  archived: false,
  reminderTime: "08:15",
  schedule: "daily",
  updatedAt: "2026-09-27T00:00:00.000Z",
  ...overrides
});
const managed = () =>
  [...scheduled.values()].filter((item) => item.identifier.startsWith("pulse-habit-reminder:"));
const forHabit = (id) => managed().filter((item) => item.content.data.habitId === id);
// Monday 2026-09-28, 07:00 local: today's 08:15 reminder is still ahead.
const monday7am = new Date(2026, 8, 28, 7, 0, 0);

(async () => {
  assert.equal(await requestNotificationPermissions(), true);
  assert.deepEqual(calls.slice(0, 2), ["channel", "permission"]);

  await syncHabitReminders(
    "user-1",
    [
      habit("daily"),
      habit("weekdays", { schedule: "weekdays", weekdays: [1, 3] }),
      habit("archived", { archived: true }),
      habit("expense", { type: "expense" })
    ],
    { now: monday7am }
  );
  assert.equal(scheduled.has("unrelated"), true, "Other notifications are left alone");
  assert.equal(forHabit("daily").length, REMINDER_HORIZON_DAYS, "One reminder per day ahead");
  assert.equal(forHabit("archived").length + forHabit("expense").length, 0);
  assert.ok(managed().every((item) => item.trigger.type === "date"), "One-shot reminders only");
  const weekdayDays = forHabit("weekdays").map((item) => item.trigger.date.getDay());
  assert.ok(weekdayDays.length > 0 && weekdayDays.every((day) => day === 1 || day === 3), "Weekday habits only on chosen days");
  const firstDaily = forHabit("daily").sort((a, b) => a.trigger.date - b.trigger.date)[0];
  assert.equal(firstDaily.trigger.date.getDate(), 28, "Today's reminder is scheduled while still ahead");
  assert.equal(firstDaily.trigger.date.getHours(), 8);
  assert.equal(firstDaily.trigger.date.getMinutes(), 15);
  assert.equal(firstDaily.content.data.habitId, "daily", "Taps can open the habit");
  assert.ok(
    managed().every((item) => item.identifier.endsWith(`:${item.trigger.date.getTime()}`)),
    "Identifiers carry the absolute instant"
  );

  // A "weekdays" habit with no days selected is never due: no reminders.
  await syncHabitReminders("user-1", [habit("none", { schedule: "weekdays", weekdays: [] })], { now: monday7am });
  assert.equal(forHabit("none").length, 0, "Empty weekdays schedule gets no reminders");

  // A weekly habit whose quota is met rests through Sunday 2026-10-04.
  await syncHabitReminders(
    "user-1",
    [habit("weekly", { schedule: "weekly", timesPerWeek: 2 })],
    { now: monday7am, suppressedUntil: new Map([["weekly", "2026-10-04"]]) }
  );
  const weeklyDates = forHabit("weekly").map((item) => item.trigger.date).sort((a, b) => a - b);
  assert.equal(weeklyDates.length, REMINDER_HORIZON_DAYS - 7, "No reminders for the rest of a completed week");
  assert.equal(weeklyDates[0].getDate(), 5, "Reminders resume on the next Monday");
  assert.equal(weeklyDates[0].getMonth(), 9);

  // Completing the habit today cancels only today's reminder.
  await syncHabitReminders("user-1", [habit("daily")], { now: monday7am, handledToday: new Set(["daily"]) });
  assert.equal(forHabit("weekdays").length, 0, "Removed habits lose their reminders");
  assert.equal(forHabit("daily").length, REMINDER_HORIZON_DAYS - 1);
  assert.ok(forHabit("daily").every((item) => item.trigger.date.getDate() !== 28), "No reminder for a habit already done today");

  // Past times today are not scheduled.
  const monday9am = new Date(2026, 8, 28, 9, 0, 0);
  await syncHabitReminders("user-1", [habit("daily")], { now: monday9am });
  assert.ok(forHabit("daily").every((item) => item.trigger.date > monday9am));

  // Changing the time reschedules.
  await syncHabitReminders("user-1", [habit("daily", { reminderTime: "09:30" })], { now: monday7am });
  assert.ok(forHabit("daily").every((item) => item.trigger.date.getHours() === 9 && item.trigger.date.getMinutes() === 30));

  // The total stays under the platform cap, nearest reminders first.
  const many = Array.from({ length: 10 }, (_, index) => habit(`h${index}`));
  await syncHabitReminders("user-1", many, { now: monday7am });
  assert.equal(managed().length, MAX_SCHEDULED_REMINDERS);
  assert.equal(
    managed().filter((item) => item.trigger.date.getDate() === 28).length,
    10,
    "Every habit keeps its nearest reminder"
  );

  permission = "denied";
  await syncHabitReminders("user-1", [habit("daily")], { now: monday7am });
  assert.equal(managed().length, 0, "No reminders without permission");

  permission = "granted";
  await syncHabitReminders("user-1", [habit("daily")], { now: monday7am });
  presented.set("pulse-habit-reminder:user-1:daily:1:08:15:2026-09-28:1", true);
  presented.set("chat-message", true);
  await clearHabitReminders();
  assert.equal(scheduled.size, 1);
  assert.equal(scheduled.has("unrelated"), true);
  assert.deepEqual([...presented.keys()], ["chat-message"], "Sign-out dismisses delivered reminders only");

  // A device timezone change moves reminders to the new local reminder time.
  await syncHabitReminders("user-1", [habit("daily")], { now: monday7am });
  const beforeIds = new Set(forHabit("daily").map((item) => item.identifier));
  process.env.TZ = "America/New_York";
  await syncHabitReminders("user-1", [habit("daily")], { now: monday7am });
  const after = forHabit("daily");
  assert.ok(after.length > 0);
  assert.ok(after.every((item) => !beforeIds.has(item.identifier)), "Old-zone reminders are replaced");
  assert.ok(
    after.every((item) => item.trigger.date.getHours() === 8 && item.trigger.date.getMinutes() === 15),
    "Reminders fire at the reminder time in the new zone"
  );
  assert.equal(scheduled.size, after.length + 1, "Old-zone reminders are cancelled");
  process.env.TZ = "Asia/Kolkata";
  await clearHabitReminders();

  // Reminder taps (including the cold-start one) open the habit once.
  const opened = [];
  const response = (id, habitId) => ({
    notification: { request: { identifier: id, content: { data: { habitId } } } }
  });
  const mine = "pulse-habit-reminder:user-1:";
  lastResponse = response(`${mine}cold`, "h1");
  const unsubscribe = subscribeToReminderTaps("user-1", (habitId) => opened.push(habitId));
  await new Promise((resolve) => setTimeout(resolve, 0));
  responseListener(response(`${mine}warm`, "h2"));
  responseListener(response(`${mine}warm`, "h2"));
  responseListener(response("pulse-habit-reminder:user-2:x", "foreign"));
  responseListener({ notification: { request: { identifier: "other", content: { data: {} } } } });
  unsubscribe();
  assert.equal(responseListener, null);
  const again = subscribeToReminderTaps("user-1", (habitId) => opened.push(habitId));
  await new Promise((resolve) => setTimeout(resolve, 0));
  again();
  assert.deepEqual(JSON.parse(JSON.stringify(opened)), ["h1", "h2"], "Taps navigate once; a remount does not replay; other accounts' reminders are ignored");
  console.log("Mobile reminder scheduling checks passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
