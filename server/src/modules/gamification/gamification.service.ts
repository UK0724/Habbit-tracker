import { env } from "../../config/env.js";
import { Types } from "mongoose";
import { UserModel } from "../auth/user.model.js";
import { HabitModel } from "../habits/habit.model.js";
import { HabitLogModel } from "../habitLogs/habitLog.model.js";
import { completed, dayState, weekStart } from "../habits/rules.js";
import {
  UserGameProfileModel,
  XPEventModel,
  PushSubscriptionModel,
  type XPReason
} from "./gamification.model.js";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  XP_REWARDS,
  getXPForNextLevel,
  type AchievementDefinition
} from "./gamification.constants.js";
import { issueAdToken, verifyAndConsumeAdToken } from "./adToken.service.js";
import { type PushPayload, sendPush } from "./push.service.js";
import { AppError } from "../../utils/appError.js";

// ─── Internal Helpers ─────────────────────────────────────────────────────────

const getUserToday = async (userId: string): Promise<string> => {
  const user = await UserModel.findById(userId).select("timezone");
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: user?.timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
};

const shiftDate = (date: string, days: number): string => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Ensures a UserGameProfile exists for the user, creating one if needed. */
const ensureProfile = async (userId: string) => {
  return UserGameProfileModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true }
  );
};

const xpStages = (amount: number) => [
  { $set: { totalXP: { $max: [0, { $add: ["$totalXP", amount] }] } } },
  {
    $set: {
      level: {
        $size: {
          $filter: {
            input: LEVEL_THRESHOLDS,
            as: "threshold",
            cond: { $lte: ["$$threshold", "$totalXP"] }
          }
        }
      }
    }
  }
];
const unlockAchievement = async (userId: string, id: string, today: string) => {
  const def = ACHIEVEMENT_MAP.get(id)!;
  const profile = await UserGameProfileModel.findOneAndUpdate(
    { userId, "achievements.id": { $ne: id } },
    [
      {
        $set: {
          achievements: {
            $concatArrays: ["$achievements", [{ id, unlockedAt: today }]]
          }
        }
      },
      ...xpStages(def.xpBonus)
    ],
    { new: true }
  );
  if (!profile) return false;
  await XPEventModel.create({
    userId,
    date: today,
    amount: def.xpBonus,
    reason: "achievement_bonus"
  });
  return true;
};
// ─── Service ──────────────────────────────────────────────────────────────────

export const gamificationService = {
  // ── Daily Check-in ──────────────────────────────────────────────────────────

  dailyCheckin: async (
    userId: string
  ): Promise<{
    alreadyCheckedIn: boolean;
    streak: number;
    longestStreak: number;
    streakBroken: boolean;
    freezeUsed: boolean;
    xpAwarded: number;
  }> => {
    const profile = await ensureProfile(userId);
    const today = await getUserToday(userId);

    // Already checked in today
    if (profile.lastLoginDate === today) {
      return {
        alreadyCheckedIn: true,
        streak: profile.loginStreak,
        longestStreak: profile.longestStreak,
        streakBroken: false,
        freezeUsed: false,
        xpAwarded: 0
      };
    }

    const yesterday = shiftDate(today, -1);
    const twoDaysAgo = shiftDate(today, -2);

    let streakBroken = false;
    let freezeUsed = false;

    if (profile.lastLoginDate === yesterday) {
      // Consecutive day — increment streak
      profile.loginStreak += 1;
    } else if (
      profile.lastLoginDate === twoDaysAgo &&
      profile.streakFreezes > 0
    ) {
      // Missed exactly one day but have a freeze — auto-use it
      profile.streakFreezes -= 1;
      profile.loginStreak += 1;
      freezeUsed = true;
    } else {
      // Streak broken
      if (profile.loginStreak > 1) {
        streakBroken = true;
      }
      profile.loginStreak = 1;
    }

    profile.lastLoginDate = today;
    if (profile.loginStreak > profile.longestStreak) {
      profile.longestStreak = profile.loginStreak;
    }

    const milestones = new Map([
      [7, XP_REWARDS.STREAK_BONUS_7],
      [14, XP_REWARDS.STREAK_BONUS_14],
      [30, XP_REWARDS.STREAK_BONUS_30],
      [100, XP_REWARDS.STREAK_BONUS_100],
      [365, XP_REWARDS.STREAK_BONUS_365]
    ]);
    const bonus = milestones.get(profile.loginStreak) ?? 0;
    const claimed = await UserGameProfileModel.findOneAndUpdate(
      {
        userId,
        lastLoginDate: { $ne: today },
        streakFreezes: { $gte: freezeUsed ? 1 : 0 }
      },
      [
        {
          $set: {
            lastLoginDate: today,
            loginStreak: profile.loginStreak,
            longestStreak: { $max: ["$longestStreak", profile.loginStreak] },
            streakFreezes: { $subtract: ["$streakFreezes", freezeUsed ? 1 : 0] }
          }
        },
        ...xpStages(XP_REWARDS.CHECKIN + bonus)
      ],
      { new: true }
    );
    if (!claimed) return gamificationService.dailyCheckin(userId);
    const xpAwarded = XP_REWARDS.CHECKIN + bonus;
    await XPEventModel.create({
      userId,
      date: today,
      amount: XP_REWARDS.CHECKIN,
      reason: "checkin"
    });
    if (bonus)
      await XPEventModel.create({
        userId,
        date: today,
        amount: bonus,
        reason: "streak_bonus"
      });
    await gamificationService.checkAchievements(userId);

    return {
      alreadyCheckedIn: false,
      streak: profile.loginStreak,
      longestStreak: profile.longestStreak,
      streakBroken,
      freezeUsed,
      xpAwarded
    };
  },

  // ── Award XP ────────────────────────────────────────────────────────────────

  awardXP: async (
    userId: string,
    amount: number,
    reason: XPReason,
    habitId?: string,
    eventDate?: string
  ): Promise<{
    xpAwarded: number;
    totalXP: number;
    level: number;
    newLevel: number | null;
    newAchievements: AchievementDefinition[];
  }> => {
    const profile = await ensureProfile(userId);
    const today = await getUserToday(userId);

    const rewardDate = eventDate ?? today;
    const previousLevel = profile.level;
    const updated = await UserGameProfileModel.findOneAndUpdate(
      {
        userId,
        ...(reason === "legendary_day"
          ? { perfectDates: { $ne: rewardDate } }
          : {})
      },
      [
        ...xpStages(amount),
        ...(reason === "legendary_day"
          ? [
              {
                $set: {
                  perfectDates: {
                    $setUnion: [
                      { $ifNull: ["$perfectDates", []] },
                      [rewardDate]
                    ]
                  }
                }
              }
            ]
          : [])
      ],
      { new: true }
    );
    if (!updated && reason === "legendary_day")
      return {
        xpAwarded: 0,
        totalXP: profile.totalXP,
        level: profile.level,
        newLevel: null,
        newAchievements: []
      };
    if (!updated) throw new AppError("Profile not found", 404);
    const newLevel = updated.level;

    await XPEventModel.create({
      userId: new Types.ObjectId(userId),
      ...(habitId ? { habitId: new Types.ObjectId(habitId) } : {}),
      date: rewardDate,
      amount,
      reason
    });

    // Level-up notification (only when gaining XP)
    let leveledUp: number | null = null;
    if (amount > 0 && newLevel > previousLevel) {
      leveledUp = newLevel;
      await gamificationService.notifyUser(userId, {
        title: `🎉 Level Up! You're now level ${newLevel}`,
        body: `You've reached "${LEVEL_TITLES[newLevel - 1]}" — keep going!`,
        tag: "level-up"
      });
    }

    // Check all achievements (only when gaining XP)
    const newAchievements =
      amount > 0 ? await gamificationService.checkAchievements(userId) : [];

    return {
      xpAwarded: amount,
      totalXP: updated.totalXP,
      level: updated.level,
      newLevel: leveledUp,
      newAchievements
    };
  },

  // ── Check Achievements ───────────────────────────────────────────────────────

  checkAchievements: async (
    userId: string
  ): Promise<AchievementDefinition[]> => {
    const profile = await ensureProfile(userId);
    const today = await getUserToday(userId);

    const unlockedIds = new Set(profile.achievements.map((a) => a.id));
    const newlyUnlocked: AchievementDefinition[] = [];

    // Helper: unlock if not already
    const tryUnlock = async (def: AchievementDefinition) => {
      if (unlockedIds.has(def.id)) return;
      unlockedIds.add(def.id);
      if (await unlockAchievement(userId, def.id, today))
        newlyUnlocked.push(def);
    };

    // ── Data we'll need ──────────────────────────────────────────────────────

    // Total log count for this user
    const userHabitIds = (await HabitModel.find({ userId }).select("_id")).map(
      (h) => h._id
    );

    const totalLogs = await HabitLogModel.countDocuments({
      habitId: { $in: userHabitIds }
    });

    // Distinct log dates
    const distinctDates = (await HabitLogModel.distinct("date", {
      habitId: { $in: userHabitIds }
    })) as string[];

    // Habits count (to check creator achievement)
    const habitCount = await HabitModel.countDocuments({ userId });

    // measurable_hit events
    const measurableHitCount = await XPEventModel.countDocuments({
      userId: new Types.ObjectId(userId),
      reason: "measurable_hit"
    });

    // Today's XP total
    const todayXPEvents = await XPEventModel.find({
      userId: new Types.ObjectId(userId),
      date: today
    });
    const todayXP = todayXPEvents.reduce((sum, e) => sum + e.amount, 0);

    // Log count today
    const logsToday = await HabitLogModel.countDocuments({
      habitId: { $in: userHabitIds },
      date: today
    });

    // legendary_day events count (perfect_day)
    const perfectDayCount = await XPEventModel.countDocuments({
      userId: new Types.ObjectId(userId),
      reason: "legendary_day"
    });

    // ── Beginner ─────────────────────────────────────────────────────────────

    if (totalLogs >= 1) {
      await tryUnlock(ACHIEVEMENT_MAP.get("first_step")!);
    }

    if (habitCount >= 1) {
      await tryUnlock(ACHIEVEMENT_MAP.get("creator")!);
    }

    if (distinctDates.length >= 3) {
      await tryUnlock(ACHIEVEMENT_MAP.get("getting_started")!);
    }

    // early_bird / night_owl: check current hour in user timezone
    const nowHour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone:
          (await UserModel.findById(userId).select("timezone"))?.timezone ||
          "UTC",
        hour: "numeric",
        hour12: false
      }).format(new Date()),
      10
    );
    if (nowHour < 8 && totalLogs >= 1) {
      await tryUnlock(ACHIEVEMENT_MAP.get("early_bird")!);
    }
    if (nowHour >= 22 && totalLogs >= 1) {
      await tryUnlock(ACHIEVEMENT_MAP.get("night_owl")!);
    }

    // ── Streak ───────────────────────────────────────────────────────────────

    if (profile.loginStreak >= 7)
      await tryUnlock(ACHIEVEMENT_MAP.get("on_fire")!);
    if (profile.loginStreak >= 14)
      await tryUnlock(ACHIEVEMENT_MAP.get("unstoppable")!);
    if (profile.loginStreak >= 30)
      await tryUnlock(ACHIEVEMENT_MAP.get("diamond_streak")!);
    if (profile.loginStreak >= 100)
      await tryUnlock(ACHIEVEMENT_MAP.get("century")!);
    if (profile.loginStreak >= 365)
      await tryUnlock(ACHIEVEMENT_MAP.get("legend")!);

    // no_excuses / iron_will: streak with no skips
    // We use loginStreak as the proxy since each checkin = no skip day
    if (profile.loginStreak >= 14)
      await tryUnlock(ACHIEVEMENT_MAP.get("no_excuses")!);
    if (profile.loginStreak >= 30)
      await tryUnlock(ACHIEVEMENT_MAP.get("iron_will")!);

    // ── Performance ──────────────────────────────────────────────────────────

    if (perfectDayCount >= 1)
      await tryUnlock(ACHIEVEMENT_MAP.get("perfect_day")!);
    if (logsToday >= 5) await tryUnlock(ACHIEVEMENT_MAP.get("speedrunner")!);
    if (measurableHitCount >= 10)
      await tryUnlock(ACHIEVEMENT_MAP.get("goal_crusher")!);
    if (todayXP >= 1000) await tryUnlock(ACHIEVEMENT_MAP.get("overachiever")!);

    // legendary_week: 7 consecutive perfect days
    if (perfectDayCount >= 7)
      await tryUnlock(ACHIEVEMENT_MAP.get("legendary_week")!);

    // ── Consistency ──────────────────────────────────────────────────────────

    if (totalLogs >= 50) await tryUnlock(ACHIEVEMENT_MAP.get("dedicated")!);
    if (totalLogs >= 100) await tryUnlock(ACHIEVEMENT_MAP.get("centurion")!);
    if (totalLogs >= 500) await tryUnlock(ACHIEVEMENT_MAP.get("veteran")!);

    // ── Levels ───────────────────────────────────────────────────────────────

    if (profile.level >= 10)
      await tryUnlock(ACHIEVEMENT_MAP.get("rising_star")!);
    if (profile.level >= 25) await tryUnlock(ACHIEVEMENT_MAP.get("warrior")!);
    if (profile.level >= 50) await tryUnlock(ACHIEVEMENT_MAP.get("champion")!);
    if (profile.level >= 100) await tryUnlock(ACHIEVEMENT_MAP.get("apex")!);

    // ── Meta / Collector ─────────────────────────────────────────────────────

    // Evaluate collector/master/completionist based on the count AFTER new unlocks
    const totalUnlocked = unlockedIds.size;
    if (totalUnlocked >= 10) await tryUnlock(ACHIEVEMENT_MAP.get("collector")!);
    if (totalUnlocked >= 25) await tryUnlock(ACHIEVEMENT_MAP.get("master")!);
    if (totalUnlocked >= 30)
      await tryUnlock(ACHIEVEMENT_MAP.get("completionist")!);

    // ── Save & notify ────────────────────────────────────────────────────────

    for (const achievement of newlyUnlocked) {
      await gamificationService.notifyUser(userId, {
        title: "Achievement Unlocked: " + achievement.name,
        body: achievement.description,
        tag: "achievement-" + achievement.id
      });
    }

    return newlyUnlocked;
  },

  // ── Get Profile ─────────────────────────────────────────────────────────────

  getProfile: async (userId: string) => {
    const profile = await ensureProfile(userId);
    const today = await getUserToday(userId);

    const xpForCurrentLevel = LEVEL_THRESHOLDS[profile.level - 1] ?? 0;
    const xpForNextLevel = getXPForNextLevel(profile.level);
    const xpIntoLevel = profile.totalXP - xpForCurrentLevel;
    const xpNeeded =
      xpForNextLevel === Infinity ? null : xpForNextLevel - xpForCurrentLevel;

    return {
      userId,
      totalXP: profile.totalXP,
      level: profile.level,
      levelTitle: LEVEL_TITLES[profile.level - 1] ?? "Apex",
      xpIntoLevel,
      xpNeeded,
      gems: profile.gems,
      loginStreak: profile.loginStreak,
      longestStreak: profile.longestStreak,
      lastLoginDate: profile.lastLoginDate,
      streakFreezes: profile.streakFreezes,
      achievementCount: profile.achievements.length,
      today
    };
  },

  // ── Get Achievements ─────────────────────────────────────────────────────────

  getAchievements: async (userId: string) => {
    const profile = await ensureProfile(userId);
    const unlockedMap = new Map(
      profile.achievements.map((a) => [a.id, a.unlockedAt])
    );

    return ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) ?? null
    }));
  },

  // ── Use Streak Freeze ────────────────────────────────────────────────────────

  useStreakFreeze: async (userId: string) => {
    await ensureProfile(userId);
    const profile = await UserGameProfileModel.findOneAndUpdate(
      { userId, gems: { $gte: 2 } },
      { $inc: { gems: -2, streakFreezes: 1 } },
      { new: true }
    );
    if (!profile)
      throw new AppError(
        "Not enough gems to purchase a streak freeze (costs 2 gems)",
        400
      );
    await unlockAchievement(userId, "wise_spender", await getUserToday(userId));

    return {
      gems: profile.gems,
      streakFreezes: profile.streakFreezes
    };
  },

  // ── Restore Streak With Ad ────────────────────────────────────────────────────

  restoreStreakWithAd: async (userId: string, adToken: string) => {
    if (env.NODE_ENV === "production")
      throw new AppError("Ad rewards are not available", 503);
    const valid = await verifyAndConsumeAdToken(adToken, userId);
    if (!valid) {
      throw new AppError("Invalid or expired ad token", 400);
    }

    const profile = await ensureProfile(userId);
    const today = await getUserToday(userId);

    // Restore streak to at least 1
    if (profile.loginStreak === 0) {
      profile.loginStreak = 1;
    }
    profile.lastLoginDate = today;
    await profile.save();

    // Unlock comeback_kid
    const def = ACHIEVEMENT_MAP.get("comeback_kid")!;
    if (!profile.achievements.find((a) => a.id === def.id)) {
      await unlockAchievement(userId, def.id, today);
    }

    return {
      streak: profile.loginStreak,
      restored: true
    };
  },

  // ── Issue Ad Token ────────────────────────────────────────────────────────────

  issueAdToken: async (userId: string) => {
    if (env.NODE_ENV === "production")
      throw new AppError(
        "Ad rewards are not available until server-side ad verification is configured",
        503
      );
    const token = issueAdToken(userId);
    return { adToken: token };
  },

  // ── Subscribe Push ────────────────────────────────────────────────────────────

  subscribePush: async (
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent: string
  ) => {
    await PushSubscriptionModel.findOneAndUpdate(
      { userId, endpoint: subscription.endpoint },
      {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent
      },
      { upsert: true, new: true }
    );
    return { subscribed: true };
  },

  // ── Unsubscribe Push ──────────────────────────────────────────────────────────

  unsubscribePush: async (userId: string) => {
    await PushSubscriptionModel.deleteMany({ userId });
    return { unsubscribed: true };
  },

  // ── Notify User ───────────────────────────────────────────────────────────────

  notifyUser: async (userId: string, payload: PushPayload): Promise<void> => {
    const subscriptions = await PushSubscriptionModel.find({ userId });
    await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPush({ endpoint: sub.endpoint, keys: sub.keys }, payload)
      )
    );
  }
};

// ─── Public helpers for other services ───────────────────────────────────────

/**
 * Called by habitLog.service after a habit is logged/updated.
 * Awards XP, checks for legendary_day bonus, returns xpAwarded + newAchievements.
 */
type RewardLog = { date: string; status: string | null; value: number | null };
export const handleHabitLogXP = async (
  userId: string,
  habit: { _id: Types.ObjectId; type: string } & Parameters<
    typeof completed
  >[0],
  previous?: RewardLog,
  next?: RewardLog
): Promise<{ xpAwarded: number; newAchievements: AchievementDefinition[] }> => {
  const reward = (log?: RewardLog) => {
    if (!log || log.status === "skipped") return 0;
    if (habit.type === "action")
      return log.status === "done" ? XP_REWARDS.ACTION_COMPLETE : 0;
    if (log.value === null) return 0;
    return completed(habit, log)
      ? XP_REWARDS.MEASURABLE_HIT
      : XP_REWARDS.MEASURABLE_LOGGED;
  };
  const delta = reward(next) - reward(previous);
  const date = next?.date ?? previous!.date;
  const reason: XPReason =
    delta < 0
      ? habit.type === "action"
        ? "action_reverted"
        : "measurable_reverted"
      : habit.type === "action"
        ? "action_complete"
        : completed(habit, next)
          ? "measurable_hit"
          : "measurable_logged";
  const result =
    delta !== 0
      ? await gamificationService.awardXP(
          userId,
          delta,
          reason,
          habit._id.toString(),
          date
        )
      : { xpAwarded: 0, newAchievements: [] as AchievementDefinition[] };
  if (!next || !completed(habit, next))
    return {
      xpAwarded: result.xpAwarded,
      newAchievements: result.newAchievements
    };

  // Check for legendary_day against habits still due on this date. Weekly
  // habits whose quota was met earlier in the week and skipped habits are
  // excused, but an all-skipped day cannot earn the bonus.
  const allHabits = await HabitModel.find({ userId, archived: { $ne: true } });
  if (allHabits.length > 0) {
    const habitIds = allHabits.map((h) => h._id);
    const weekLogs = await HabitLogModel.find({
      habitId: { $in: habitIds },
      date: { $gte: weekStart(date), $lte: date }
    });
    const logsByHabit = new Map<string, RewardLog[]>();
    for (const log of weekLogs) {
      const key = log.habitId.toString();
      const entries = logsByHabit.get(key) ?? [];
      entries.push(log);
      logsByHabit.set(key, entries);
    }
    const dueHabits = allHabits.filter((h) => {
      const state = dayState(
        h,
        logsByHabit.get(h._id.toString()) ?? [],
        date,
        date
      );
      return state !== "rest" && state !== "skipped";
    });
    const allDone =
      dueHabits.length > 0 &&
      dueHabits.every((h) =>
        completed(
          h,
          logsByHabit.get(h._id.toString())?.find((log) => log.date === date)
        )
      );

    if (allDone) {
      // Only award legendary_day once per day
      const alreadyAwarded = await XPEventModel.findOne({
        userId: new Types.ObjectId(userId),
        date,
        reason: "legendary_day"
      });

      if (!alreadyAwarded) {
        const bonus = await gamificationService.awardXP(
          userId,
          XP_REWARDS.LEGENDARY_DAY,
          "legendary_day",
          undefined,
          date
        );
        result.xpAwarded += bonus.xpAwarded;
      }
    }
  }

  return {
    xpAwarded: result.xpAwarded,
    newAchievements: result.newAchievements
  };
};
