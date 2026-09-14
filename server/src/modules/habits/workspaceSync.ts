import { HabitModel } from "./habit.model.js";
import { HabitLogModel } from "../habitLogs/habitLog.model.js";
import { UserModel } from "../auth/user.model.js";
import { scheduled } from "./rules.js";
export const userToday = async (userId: string) => {
  const user = await UserModel.findById(userId).select("timezone");
  return new Intl.DateTimeFormat("en-CA", { timeZone: user?.timezone || "UTC", year:"numeric",month:"2-digit",day:"2-digit" }).format(new Date());
};
/** Insert once per day. Never overwrite an explicit user check-in or skip. */
export const syncWorkspaceActivity = async (userId: string, link: "linkToExpenseTracker" | "linkToDSAPrep" | "linkToJobTracker", date: string, comment: string) => {
  const habits = await HabitModel.find({ userId, [link]: true, type: "action", archived: { $ne: true } });
  for (const habit of habits) {
    if (!scheduled(habit, date)) continue;
    try {
      await HabitLogModel.updateOne({ habitId: habit._id, date }, { $setOnInsert: { status: "done", value: null, comment, source: link } }, { upsert: true });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    }
  }
};
