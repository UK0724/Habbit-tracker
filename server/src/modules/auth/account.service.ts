import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { AppError } from "../../utils/appError.js";
import { BudgetModel, ExpenseModel } from "../expenses/expense.model.js";
import {
  PushSubscriptionModel,
  UserGameProfileModel,
  XPEventModel
} from "../gamification/gamification.model.js";
import { HabitLogModel } from "../habitLogs/habitLog.model.js";
import { HabitModel } from "../habits/habit.model.js";
import { UserModel } from "./user.model.js";

/**
 * Permanently deletes a user and everything they own. The user record goes
 * last, so a failure part-way leaves an account the user can retry deleting.
 */
export const deleteAccount = async (userId: string, password: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!(await bcrypt.compare(password, user.passwordHash)))
    // 403, not 401: clients sign out on 401, which would hide this error.
    throw new AppError("Incorrect password", 403);

  const habitIds = await HabitModel.find({ userId }).distinct("_id");
  await HabitLogModel.deleteMany({ habitId: { $in: habitIds } });
  await Promise.all([
    HabitModel.deleteMany({ userId }),
    ExpenseModel.deleteMany({ userId }),
    BudgetModel.deleteMany({ userId }),
    UserGameProfileModel.deleteMany({ userId }),
    XPEventModel.deleteMany({ userId }),
    PushSubscriptionModel.deleteMany({ userId }),
    // Data left from the removed job tracker and DSA prep features.
    mongoose.connection.collection("dsaprepprofiles").deleteMany({ userId: new mongoose.Types.ObjectId(userId) }),
    mongoose.connection.collection("jobsearchprofiles").deleteMany({ userId: new mongoose.Types.ObjectId(userId) }),
    // Reminder claims are keyed "<userId>:<date>:<time>" and expire in 48h.
    mongoose.connection
      .collection<{ _id: string }>("reminderclaims")
      .deleteMany({ _id: { $regex: `^${userId}:` } })
  ]);
  await UserModel.deleteOne({ _id: userId });
};
