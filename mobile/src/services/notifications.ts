import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Habit } from "@habit-tracker/shared";

const REMINDER_PREFIX = "pulse-habit-reminder:";
const REMINDER_CHANNEL = "habit-reminders";
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
/** Days of one-shot reminders kept scheduled ahead. */
export const REMINDER_HORIZON_DAYS = 14;
/** Stay under iOS's 64 pending-notification cap (and keep Android tidy). */
export const MAX_SCHEDULED_REMINDERS = 60;

/*
 * Reminder strategy (1.1.0): instead of repeating DAILY/WEEKLY triggers,
 * each habit gets one-shot DATE reminders for the next 14 days. A repeating
 * trigger cannot skip a single day, so it would still nag after the habit
 * was done. With per-day reminders, every sync (app open, resume and after
 * each log, because the habits query refreshes) cancels today's reminder
 * for habits that are already completed, skipped or resting today. The
 * horizon is refreshed on each sync, so reminders keep flowing while the
 * app is used at least once every two weeks.
 *
 * Identifiers include the absolute instant, so after a device timezone
 * change the next sync cancels reminders still set for the old wall-clock
 * time and schedules them at the reminder time in the new zone.
 */

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

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export interface ReminderSyncOptions {
  /** Habit ids already completed, skipped or resting today: no reminder today. */
  handledToday?: ReadonlySet<string>;
  /**
   * Habit id -> last local date ("YYYY-MM-DD", inclusive) with no reminders,
   * e.g. a weekly habit whose quota is met rests until the end of its week.
   */
  suppressedUntil?: ReadonlyMap<string, string>;
  now?: Date;
}

/** Identifier prefix of one user's reminders. */
const userPrefix = (userId: string) => `${REMINDER_PREFIX}${userId}:`;

const reminderRequests = (
  userId: string,
  habits: Habit[],
  {
    handledToday = new Set<string>(),
    suppressedUntil = new Map<string, string>(),
    now = new Date()
  }: ReminderSyncOptions
) => {
  const upcoming: { at: number; request: Notifications.NotificationRequestInput }[] = [];
  for (const habit of habits) {
    if (habit.archived || habit.type === "expense" || !habit.reminderTime) continue;
    const match = TIME_PATTERN.exec(habit.reminderTime);
    if (!match) continue;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const version = Date.parse(habit.updatedAt);
    // A "weekdays" habit with no days selected is never due: no reminders.
    const weekdays = habit.schedule === "weekdays" ? new Set(habit.weekdays ?? []) : null;
    if (weekdays && weekdays.size === 0) continue;
    const quietUntil = suppressedUntil.get(habit.id);

    for (let offset = 0; offset < REMINDER_HORIZON_DAYS; offset += 1) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute, 0, 0);
      if (at.getTime() <= now.getTime()) continue;
      if (weekdays && !weekdays.has(at.getDay())) continue;
      if (offset === 0 && handledToday.has(habit.id)) continue;
      if (quietUntil && dateKey(at) <= quietUntil) continue;
      const identifier = `${userPrefix(userId)}${habit.id}:${version}:${habit.reminderTime}:${dateKey(at)}:${at.getTime()}`;
      upcoming.push({
        at: at.getTime(),
        request: {
          identifier,
          content: {
            title: `Still to do: ${habit.title}`,
            body: "Open Pulse to check it off and keep your streak going.",
            sound: true,
            data: { habitId: habit.id, url: `/habits/${habit.id}` }
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            channelId: REMINDER_CHANNEL
          }
        }
      });
    }
  }
  upcoming.sort((a, b) => a.at - b.at);
  return new Map(
    upcoming
      .slice(0, MAX_SCHEDULED_REMINDERS)
      .map(({ request }) => [request.identifier as string, request] as const)
  );
};

let pendingSync: Promise<void> = Promise.resolve();

const syncNow = async (
  userId: string | null,
  habits: Habit[],
  options: ReminderSyncOptions
) => {
  if (Platform.OS === "web") return;

  const existing = (
    await Notifications.getAllScheduledNotificationsAsync()
  ).filter((request) => request.identifier.startsWith(REMINDER_PREFIX));
  const desired = userId
    ? reminderRequests(userId, habits, options)
    : new Map<string, Notifications.NotificationRequestInput>();
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

export const syncHabitReminders = (
  userId: string | null,
  habits: Habit[],
  options: ReminderSyncOptions = {}
) => {
  const run = pendingSync.then(() => syncNow(userId, habits, options));
  pendingSync = run.catch(() => undefined);
  return run;
};

/** Removes already-delivered reminders from the notification shade. */
const dismissDeliveredReminders = async () => {
  if (Platform.OS === "web") return;
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const notification of presented) {
      const identifier = notification.request.identifier;
      if (identifier.startsWith(REMINDER_PREFIX))
        await Notifications.dismissNotificationAsync(identifier);
    }
  } catch (error) {
    console.error("[reminders] Could not dismiss delivered reminders", error);
  }
};

/** Cancels every scheduled reminder and dismisses delivered ones (sign-out). */
export const clearHabitReminders = async () => {
  await syncHabitReminders(null, []);
  await dismissDeliveredReminders();
};

const habitIdFrom = (response: Notifications.NotificationResponse | null) => {
  const data = response?.notification.request.content.data as { habitId?: unknown } | undefined;
  return typeof data?.habitId === "string" && data.habitId ? data.habitId : null;
};

// Module scope so a remount never replays the cold-start tap.
const handledReminderTaps = new Set<string>();

/**
 * Calls `onOpen(habitId)` when the user taps one of `userId`'s habit
 * reminders, including the tap that cold-started the app. Taps on another
 * account's reminder (delivered before a sign-out) are ignored. Returns an
 * unsubscribe function.
 */
export const subscribeToReminderTaps = (
  userId: string,
  onOpen: (habitId: string) => void
) => {
  if (Platform.OS === "web") return () => undefined;
  let active = true;
  const handle = (response: Notifications.NotificationResponse | null) => {
    const habitId = habitIdFrom(response);
    const key = response?.notification.request.identifier ?? "";
    if (!active || !habitId || handledReminderTaps.has(key)) return;
    if (!key.startsWith(userPrefix(userId))) return;
    handledReminderTaps.add(key);
    onOpen(habitId);
  };
  void Notifications.getLastNotificationResponseAsync()
    .then(handle)
    .catch(() => undefined);
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => {
    active = false;
    subscription.remove();
  };
};
