import { AppError } from "../../utils/appError.js";
import {
  ACHIEVEMENT_MAP,
  STREAK_REPAIR_GEM_COST,
  STREAK_REPAIR_WINDOW_DAYS,
  type Achievement
} from "../gamification/gamification.constants.js";
import { UserGameProfileModel } from "../gamification/gamification.model.js";
import {
  ensureProfile,
  gamificationService,
  summarizeReward,
  unlockAchievement
} from "../gamification/gamification.service.js";
import { HabitLogModel } from "../habitLogs/habitLog.model.js";
import { HabitModel } from "./habit.model.js";
import { dayState, rulesAt, scheduled, shift, startDateOf, type Entry, type TrackedHabit } from "./rules.js";
import { userToday } from "./workspaceSync.js";

/** Log source marking a missed day excused by a paid streak repair ("frozen"). */
export const STREAK_REPAIR_SOURCE = "streak_repair";

export type StreakRepairOffer = { date: string; freezeCost: 1; gemCost: number };

type RepairableHabit = TrackedHabit & { archived?: boolean };

/**
 * The oldest missed day in the repair window that interrupted a running
 * streak. Oldest first: repairing a later day alone would leave the earlier
 * miss still breaking the streak.
 */
export const findRepairableDate = (
  habit: RepairableHabit,
  entries: Entry[],
  today: string
): string | null => {
  if (habit.archived || habit.type === "expense") return null;
  for (let back = STREAK_REPAIR_WINDOW_DAYS; back >= 1; back -= 1) {
    const date = shift(today, -back);
    if (date < startDateOf(habit) || !scheduled(habit, date)) continue;
    if (rulesAt(habit, date).schedule === "weekly") continue;
    if (dayState(habit, entries, date, today) !== "missed") continue;
    // A streak must have been running: the previous scheduled day was kept.
    for (let prev = shift(date, -1), steps = 0; steps < 7; prev = shift(prev, -1), steps += 1) {
      if (prev < startDateOf(habit)) return null;
      if (!scheduled(habit, prev)) continue;
      const state = dayState(habit, entries, prev, today);
      return state === "completed" || state === "skipped" ? date : null;
    }
    return null;
  }
  return null;
};

export const streakRepairOffer = (
  habit: RepairableHabit,
  entries: Entry[],
  today: string
): StreakRepairOffer | null => {
  const date = findRepairableDate(habit, entries, today);
  return date ? { date, freezeCost: 1, gemCost: STREAK_REPAIR_GEM_COST } : null;
};

/** Spends a freeze (or gems) to excuse one missed day so the habit's streak continues. */
export const repairHabitStreak = (userId: string, habitId: string, date: string) =>
  summarizeReward(userId, async () => {
    const habit = await HabitModel.findOne({ _id: habitId, userId });
    if (!habit) throw new AppError("Habit not found", 404);
    const today = await userToday(userId);
    const logs = await HabitLogModel.find({ habitId: habit._id });
    if (findRepairableDate(habit, logs, today) !== date)
      throw new AppError("This day can't be repaired", 400);

    // Pay atomically: a freeze if available, otherwise gems.
    await ensureProfile(userId);
    let paidWith: "freeze" | "gems" = "freeze";
    let paid = await UserGameProfileModel.findOneAndUpdate(
      { userId, streakFreezes: { $gte: 1 } },
      { $inc: { streakFreezes: -1 } },
      { new: true }
    );
    if (!paid) {
      paidWith = "gems";
      paid = await UserGameProfileModel.findOneAndUpdate(
        { userId, gems: { $gte: STREAK_REPAIR_GEM_COST } },
        { $inc: { gems: -STREAK_REPAIR_GEM_COST } },
        { new: true }
      );
    }
    if (!paid)
      throw new AppError(
        `You need a streak freeze or ${STREAK_REPAIR_GEM_COST} gems to repair this streak`,
        400
      );

    try {
      // Only a missing or "not done" entry is replaced; a concurrent log wins.
      const log = await HabitLogModel.findOneAndUpdate(
        { habitId: habit._id, date, $or: [{ status: "not_done" }, { status: null, value: null }] },
        { $set: { status: "skipped", value: null, source: STREAK_REPAIR_SOURCE } },
        { new: true }
      ) ?? (await HabitLogModel.create({
        habitId: habit._id,
        date,
        status: "skipped",
        value: null,
        source: STREAK_REPAIR_SOURCE
      }));
      const newAchievements: Achievement[] = [];
      if (await unlockAchievement(userId, "second_chance", today))
        newAchievements.push(
          ACHIEVEMENT_MAP.get("second_chance")!,
          ...(await gamificationService.checkAchievements(userId))
        );
      return {
        xpAwarded: 0,
        newAchievements,
        paidWith,
        date: log.date,
        streakFreezes: paid.streakFreezes,
        gems: paid.gems
      };
    } catch (error) {
      // Refund if the day could not be excused (e.g. logged meanwhile).
      await UserGameProfileModel.updateOne(
        { userId },
        paidWith === "freeze"
          ? { $inc: { streakFreezes: 1 } }
          : { $inc: { gems: STREAK_REPAIR_GEM_COST } }
      );
      if ((error as { code?: number }).code === 11000)
        throw new AppError("This day was logged meanwhile. Refresh and try again.", 409);
      throw error;
    }
  });
