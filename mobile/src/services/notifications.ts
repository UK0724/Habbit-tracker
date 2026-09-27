import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Habit } from "@habit-tracker/shared";

const REMINDER_PREFIX = "pulse-habit-reminder:";
const REMINDER_CHANNEL = "habit-reminders";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ensureReminderChannel = async () => {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: "Habit reminders",
    importance: Notifications.AndroidImportance.DEFAULT
  });
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  try {
    await ensureReminderChannel();
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
};

const reminderRequests = (userId: string, habits: Habit[]) => {
  const requests = new Map<string, Notifications.NotificationRequestInput>();
  for (const habit of habits) {
    if (habit.archived || !habit.reminderTime) continue;
    const match = TIME_PATTERN.exec(habit.reminderTime);
    if (!match) continue;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const version = Date.parse(habit.updatedAt);
    const baseId = `${REMINDER_PREFIX}${userId}:${habit.id}:${version}:${habit.reminderTime}`;
    const weekdays =
      habit.schedule === "weekdays" && habit.weekdays?.length
        ? habit.weekdays
        : null;

    for (const day of weekdays ?? [null]) {
      const identifier = `${baseId}:${day === null ? "daily" : `weekday-${day}`}`;
      const trigger: Notifications.NotificationTriggerInput =
        day === null
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
              channelId: REMINDER_CHANNEL
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: day + 1,
              hour,
              minute,
              channelId: REMINDER_CHANNEL
            };
      requests.set(identifier, {
        identifier,
        content: {
          title: `Time for ${habit.title}`,
          body: "Check in with your habit in Pulse.",
          sound: true,
          data: { habitId: habit.id }
        },
        trigger
      });
    }
  }
  return requests;
};

let pendingSync: Promise<void> = Promise.resolve();

const syncNow = async (userId: string | null, habits: Habit[]) => {
  if (Platform.OS === "web") return;

  const existing = (
    await Notifications.getAllScheduledNotificationsAsync()
  ).filter((request) => request.identifier.startsWith(REMINDER_PREFIX));
  const desired = userId ? reminderRequests(userId, habits) : new Map();
  if (desired.size > 0) {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") desired.clear();
  }

  if (Platform.OS === "android" && desired.size > 0) {
    await ensureReminderChannel();
  }

  for (const request of existing) {
    if (!desired.has(request.identifier))
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
  const existingIds = new Set(existing.map((request) => request.identifier));
  for (const [identifier, request] of desired) {
    if (!existingIds.has(identifier))
      await Notifications.scheduleNotificationAsync(request);
  }
};

export const syncHabitReminders = (userId: string | null, habits: Habit[]) => {
  const run = pendingSync.then(() => syncNow(userId, habits));
  pendingSync = run.catch(() => undefined);
  return run;
};

export const clearHabitReminders = () => syncHabitReminders(null, []);
