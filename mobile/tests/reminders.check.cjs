const assert = require("node:assert/strict");
const fs = require("node:fs");
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
const notifications = {
  SchedulableTriggerInputTypes: { DAILY: "daily", WEEKLY: "weekly" },
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
  console
});

const {
  requestNotificationPermissions,
  syncHabitReminders,
  clearHabitReminders
} = moduleObject.exports;
const habit = (id, overrides = {}) => ({
  id,
  title: `Habit ${id}`,
  archived: false,
  reminderTime: "08:15",
  schedule: "daily",
  updatedAt: "2026-09-27T00:00:00.000Z",
  ...overrides
});

(async () => {
  assert.equal(await requestNotificationPermissions(), true);
  assert.deepEqual(calls.slice(0, 2), ["channel", "permission"]);

  await syncHabitReminders("user-1", [
    habit("daily"),
    habit("weekdays", { schedule: "weekdays", weekdays: [1, 3] }),
    habit("archived", { archived: true })
  ]);
  const managed = [...scheduled.values()].filter((item) =>
    item.identifier.startsWith("pulse-habit-reminder:")
  );
  assert.equal(managed.length, 3);
  assert.equal(scheduled.has("unrelated"), true);
  assert.equal(
    managed.filter((item) => item.trigger.type === "weekly").length,
    2
  );
  assert.deepEqual(
    managed
      .filter((item) => item.trigger.type === "weekly")
      .map((item) => item.trigger.weekday)
      .sort(),
    [2, 4]
  );

  await syncHabitReminders("user-1", [habit("daily")]);
  assert.equal(
    [...scheduled.keys()].filter((id) => id.startsWith("pulse-habit-reminder:"))
      .length,
    1
  );

  await syncHabitReminders("user-1", [
    habit("daily", { reminderTime: "09:30" })
  ]);
  const remaining = [...scheduled.values()].find((item) =>
    item.identifier.startsWith("pulse-habit-reminder:")
  );
  assert.equal(remaining.trigger.hour, 9);
  assert.equal(remaining.trigger.minute, 30);

  permission = "denied";
  await syncHabitReminders("user-1", [habit("daily")]);
  assert.equal(scheduled.size, 1);

  permission = "granted";
  await syncHabitReminders("user-1", [habit("daily")]);
  await clearHabitReminders();
  assert.equal(scheduled.size, 1);
  assert.equal(scheduled.has("unrelated"), true);
  console.log("Mobile reminder scheduling checks passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
