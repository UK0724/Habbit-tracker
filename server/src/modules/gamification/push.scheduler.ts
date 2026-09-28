import cron from "node-cron";
import { Schema, model } from "mongoose";
import { HabitModel } from "../habits/habit.model.js";
import { HabitLogModel } from "../habitLogs/habitLog.model.js";
import { UserModel } from "../auth/user.model.js";
import { PushSubscriptionModel } from "./gamification.model.js";
import { sendPush } from "./push.service.js";
import { scheduled } from "../habits/rules.js";

/**
 * Checks whether a user still has unlogged habits for today and sends
 * a streak reminder push notification.
 */
export const sendStreakReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const habitsWithReminder = await HabitModel.find({
      reminderTime: { $regex: "^[0-2][0-9]:[0-5][0-9]$" },
      archived: { $ne: true }
    }).select("userId reminderTime");

    if (habitsWithReminder.length === 0) return;

    // Deduplicate userIds
    const userIdSet = new Set(
      habitsWithReminder.map((h) => h.userId.toString())
    );

    for (const userId of userIdSet) {
      try {
        // Find all active (non-archived) habits for this user
        const allHabits = await HabitModel.find({
          userId,
          archived: { $ne: true }
        });

        if (allHabits.length === 0) continue;

        // Get user's local today
        const user = await UserModel.findById(userId).select("timezone");
        const localTime = new Intl.DateTimeFormat("en-GB", {
          timeZone: user?.timezone || "UTC",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23"
        }).format(now);
        if (
          !habitsWithReminder.some(
            (h) =>
              h.userId.toString() === userId && h.reminderTime === localTime
          )
        )
          continue;
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: user?.timezone || "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(new Date());

        // Find habits scheduled for today
        const scheduledToday = allHabits.filter((h) => scheduled(h, today));
        if (scheduledToday.length === 0) continue;

        // Check which habits have logs today
        const habitIds = scheduledToday.map((h) => h._id);
        const logsToday = await HabitLogModel.find({
          habitId: { $in: habitIds },
          date: today
        }).select("habitId status value");

        const loggedHabitIds = new Set(
          logsToday
            .filter((l) => l.status !== null || l.value !== null)
            .map((l) => l.habitId.toString())
        );

        const pending = scheduledToday.filter(
          (h) => !loggedHabitIds.has(h._id.toString())
        );

        if (pending.length === 0) continue;

        // Fetch push subscriptions for this user
        const subscriptions = await PushSubscriptionModel.find({ userId });
        if (subscriptions.length === 0) continue;

        const payload = {
          title: "🔥 Don't break your streak!",
          body:
            pending.length === 1
              ? `You still need to log "${pending[0]?.title ?? "a habit"}" today.`
              : `You have ${pending.length} habits left to log today.`,
          tag: "streak-reminder",
          url: "/"
        };

        const claimed = await ReminderClaim.updateOne(
          { _id: userId + ":" + today + ":" + localTime },
          {
            $setOnInsert: {
              expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000)
            }
          },
          { upsert: true }
        );
        if (!claimed.upsertedCount) continue;
        await Promise.allSettled(
          subscriptions.map((sub) =>
            sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload)
          )
        );
      } catch (userErr) {
        console.error(
          `[push.scheduler] Error processing user ${userId}:`,
          userErr
        );
      }
    }
  } catch (err) {
    console.error("[push.scheduler] Error in streak reminder job:", err);
  }
};

/**
 * Starts one scheduler per process; persisted claims deduplicate across instances.
 */
const claimSchema = new Schema({ _id: String, expiresAt: Date });
claimSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const ReminderClaim = model("ReminderClaim", claimSchema);
let task: ReturnType<typeof cron.schedule> | undefined;
export const startPushScheduler = (): void => {
  if (task) return;
  // Match each user’s local reminder time to the minute.
  task = cron.schedule("* * * * *", () => {
    void sendStreakReminders();
  });

  console.log(
    "[push.scheduler] Streak reminder scheduler started (every minute)."
  );
};
