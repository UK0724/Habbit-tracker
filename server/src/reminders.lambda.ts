import { connectDatabase } from "./config/database.js";
import { sendStreakReminders } from "./modules/gamification/push.scheduler.js";

// Invoke from an AWS schedule, never from a public HTTP route.
export const handler = async () => {
  await connectDatabase();
  await sendStreakReminders();
};
