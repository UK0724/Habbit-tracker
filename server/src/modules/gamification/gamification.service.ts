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
  GEM_REWARDS,
  STREAK_RESTORE_COST,
  STREAK_RESTORE_WINDOW_MS,
  XP_REWARDS,
  getXPForNextLevel,
  type Achievement
} from "./gamification.constants.js";
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
export const ensureProfile = async (userId: string) => {
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
export const unlockAchievement = async (userId: string, id: string, today: string) => {
  const def = ACHIEVEMENT_MAP.get(id)!;
  const profile = await UserGameProfileModel.findOneAndUpdate(
    { userId, "achievements.id": { $ne: id } },
    [
      {
        $set: {
          achievements: {
            $concatArrays: ["$achievements", [{ id, unlockedAt: today }]]
          },
          gems: { $add: [{ $ifNull: ["$gems", 0] }, def.gemBonus] }
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
export type LevelUp = { level: number; title: string };
export type RewardSummary = {
  xpAwarded: number;
  newAchievements: Achievement[];
  levelUp: LevelUp | null;
  gemsAwarded: number;
  /** This action earned the Legendary Day bonus (included in xpAwarded). */
  legendaryDay: boolean;
  /** Set when logging today performed the day's check-in automatically. */
  checkin: CheckinResult | null;
};

/** Diffs the profile around a reward so clients can celebrate exactly what changed. */
export const summarizeReward = async <
  T extends { xpAwarded: number; newAchievements: Achievement[] } & Partial<
    Pick<RewardSummary, "legendaryDay" | "checkin">
  >
>(
  userId: string,
  run: () => Promise<T>
): Promise<T & RewardSummary> => {
  const before = await ensureProfile(userId);
  const result = await run();
  const after = (await UserGameProfileModel.findOne({ userId })) ?? before;
  return {
    ...result,
    legendaryDay: result.legendaryDay ?? false,
    checkin: result.checkin ?? null,
    levelUp:
      after.level > before.level
        ? { level: after.level, title: LEVEL_TITLES[after.level - 1] ?? "Apex" }
        : null,
    gemsAwarded: Math.max(0, after.gems - before.gems)
  };
};

const restoreInfo = (profile: { brokenStreak?: number | null; brokenAt?: Date | null }) => {
  const expiresAt =
    profile.brokenStreak && profile.brokenAt
      ? new Date(profile.brokenAt.getTime() + STREAK_RESTORE_WINDOW_MS)
      : null;
  const canRestore = !!expiresAt && expiresAt.getTime() > Date.now();
  return {
    canRestore,
    restoreCost: STREAK_RESTORE_COST,
    restoreExpiresAt: canRestore ? expiresAt!.toISOString() : null,
    brokenStreak: canRestore
      ? { previousStreak: profile.brokenStreak!, restoreExpiresAt: expiresAt!.toISOString() }
      : null
  };
};

export type CheckinResult = {
  alreadyCheckedIn: boolean;
  streak: number;
  longestStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  xpAwarded: number;
  previousStreak: number;
  canRestore: boolean;
  restoreCost: number;
  restoreExpiresAt: string | null;
  /** No active habit yet: nothing was recorded and the streak hasn't started. */
  needsHabit: boolean;
  newAchievements: Achievement[];
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const gamificationService = {
  // ── Daily Check-in ──────────────────────────────────────────────────────────

  dailyCheckin: (userId: string) =>
    summarizeReward(userId, () => gamificationService.claimCheckin(userId)),

  claimCheckin: async (userId: string): Promise<CheckinResult> => {
    const profile = await ensureProfile(userId);
    const today = await getUserToday(userId);

    // Already checked in today
    if (profile.lastLoginDate === today) {
      const { canRestore, restoreCost, restoreExpiresAt } = restoreInfo(profile);
      return {
        alreadyCheckedIn: true,
        streak: profile.loginStreak,
        longestStreak: profile.longestStreak,
        streakBroken: false,
        freezeUsed: false,
        xpAwarded: 0,
        previousStreak: profile.loginStreak,
        canRestore,
        restoreCost,
        restoreExpiresAt,
        needsHabit: false,
        newAchievements: []
      };
    }
    // The streak starts with the first habit, not the first app open.
    if (!(await HabitModel.exists({ userId, archived: { $ne: true } }))) {
      return {
        alreadyCheckedIn: false,
        streak: profile.loginStreak,
        longestStreak: profile.longestStreak,
        streakBroken: false,
        freezeUsed: false,
        xpAwarded: 0,
        previousStreak: profile.loginStreak,
        canRestore: false,
        restoreCost: STREAK_RESTORE_COST,
        restoreExpiresAt: null,
        needsHabit: true,
        newAchievements: []
      };
    }
    const previousStreak = profile.loginStreak;

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
            streakFreezes: { $subtract: ["$streakFreezes", freezeUsed ? 1 : 0] },
            gems: {
              $add: [
                { $ifNull: ["$gems", 0] },
                bonus ? GEM_REWARDS.STREAK_MILESTONE : 0
              ]
            },
            ...(streakBroken
              ? { brokenStreak: previousStreak, brokenAt: new Date() }
              : {})
          }
        },
        ...xpStages(XP_REWARDS.CHECKIN + bonus)
      ],
      { new: true }
    );
    if (!claimed) return gamificationService.claimCheckin(userId);
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
    const newAchievements: Achievement[] = [];
    if (streakBroken && (await unlockAchievement(userId, "comeback_kid", today)))
      newAchievements.push(ACHIEVEMENT_MAP.get("comeback_kid")!);
    newAchievements.push(...(await gamificationService.checkAchievements(userId)));

    const { canRestore, restoreCost, restoreExpiresAt } = restoreInfo(claimed);
    return {
      alreadyCheckedIn: false,
      streak: profile.loginStreak,
      longestStreak: profile.longestStreak,
      streakBroken,
      freezeUsed,
      xpAwarded,
      previousStreak,
      canRestore,
      restoreCost,
      restoreExpiresAt,
      needsHabit: false,
      newAchievements
    };
  },

  // ── Restore Streak With Gems ────────────────────────────────────────────────

  restoreStreak: (userId: string) =>
    summarizeReward(userId, async () => {
      await ensureProfile(userId);
      const restored = await UserGameProfileModel.findOneAndUpdate(
        {
          userId,
          gems: { $gte: STREAK_RESTORE_COST },
          brokenStreak: { $gt: 0 },
          brokenAt: { $gt: new Date(Date.now() - STREAK_RESTORE_WINDOW_MS) }
        },
        [
          {
            $set: {
              gems: { $subtract: ["$gems", STREAK_RESTORE_COST] },
              loginStreak: { $add: ["$loginStreak", "$brokenStreak"] }
            }
          },
          {
            $set: {
              longestStreak: { $max: ["$longestStreak", "$loginStreak"] },
              brokenStreak: null,
              brokenAt: null
            }
          }
        ],
        { new: true }
      );
      if (!restored) {
        const profile = await ensureProfile(userId);
        throw new AppError(
          restoreInfo(profile).canRestore
            ? `Not enough gems to restore your streak (costs ${STREAK_RESTORE_COST} gems)`
            : "There is no broken streak to restore right now",
          400
        );
      }
      const newAchievements = await gamificationService.checkAchievements(userId);
      return {
        streak: restored.loginStreak,
        gems: restored.gems,
        xpAwarded: 0,
        newAchievements
      };
    }),

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
    newAchievements: Achievement[];
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
    const fromLog = ["action_complete", "measurable_hit", "measurable_logged"].includes(reason) &&
      rewardDate === today;
    const newAchievements =
      amount > 0 ? await gamificationService.checkAchievements(userId, { fromLog }) : [];

    return {
      xpAwarded: amount,
      totalXP: updated.totalXP,
      level: updated.level,
      newLevel: leveledUp,
      newAchievements
    };
  },

  // ── Check Achievements ───────────────────────────────────────────────────────

  /** `fromLog`: triggered by logging a habit right now (enables time-of-day badges). */
  checkAchievements: async (
    userId: string,
    options: { fromLog?: boolean } = {}
  ): Promise<Achievement[]> => {
    const profile = await ensureProfile(userId);
    const today = await getUserToday(userId);

    const unlockedIds = new Set(profile.achievements.map((a) => a.id));
    const newlyUnlocked: Achievement[] = [];

    // Helper: unlock if not already
    const tryUnlock = async (def: Achievement) => {
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

    // Logs today that count as activity (skips don't)
    const logsToday = await HabitLogModel.countDocuments({
      habitId: { $in: userHabitIds },
      date: today,
      status: { $ne: "skipped" }
    });

    // Longest run of consecutive days with at least one completed/logged habit
    const activeDates = (
      (await HabitLogModel.distinct("date", {
        habitId: { $in: userHabitIds },
        $or: [{ status: "done" }, { value: { $ne: null } }]
      })) as string[]
    ).sort();
    const longestRun = (dates: string[]) => {
      let best = 0, run = 0, previous: string | null = null;
      for (const date of dates) {
        run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
        best = Math.max(best, run);
        previous = date;
      }
      return best;
    };
    const activeDayRun = longestRun(activeDates);
    const perfectDayRun = longestRun([...(profile.perfectDates ?? [])].sort());

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
    if (options.fromLog && nowHour < 8) {
      await tryUnlock(ACHIEVEMENT_MAP.get("early_bird")!);
    }
    if (options.fromLog && nowHour >= 22) {
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

    // no_excuses / iron_will: consecutive days with a completed habit
    if (activeDayRun >= 14)
      await tryUnlock(ACHIEVEMENT_MAP.get("no_excuses")!);
    if (activeDayRun >= 30)
      await tryUnlock(ACHIEVEMENT_MAP.get("iron_will")!);

    // ── Performance ──────────────────────────────────────────────────────────

    if (perfectDayCount >= 1)
      await tryUnlock(ACHIEVEMENT_MAP.get("perfect_day")!);
    if (logsToday >= 5) await tryUnlock(ACHIEVEMENT_MAP.get("speedrunner")!);
    if (measurableHitCount >= 10)
      await tryUnlock(ACHIEVEMENT_MAP.get("goal_crusher")!);
    if (todayXP >= 1000) await tryUnlock(ACHIEVEMENT_MAP.get("overachiever")!);

    // legendary_week: 7 consecutive perfect days
    if (perfectDayRun >= 7)
      await tryUnlock(ACHIEVEMENT_MAP.get("legendary_week")!);

    // ── Consistency ──────────────────────────────────────────────────────────

    if (totalLogs >= 50) await tryUnlock(ACHIEVEMENT_MAP.get("dedicated")!);
    if (totalLogs >= 100) await tryUnlock(ACHIEVEMENT_MAP.get("centurion")!);
    if (totalLogs >= 500) await tryUnlock(ACHIEVEMENT_MAP.get("veteran")!);

    // ── Levels ───────────────────────────────────────────────────────────────

    // Re-read: bonus XP from badges unlocked above can raise the level.
    const level =
      (await UserGameProfileModel.findOne({ userId }).select("level"))?.level ??
      profile.level;
    if (level >= 10) await tryUnlock(ACHIEVEMENT_MAP.get("rising_star")!);
    if (level >= 25) await tryUnlock(ACHIEVEMENT_MAP.get("warrior")!);
    if (level >= 50) await tryUnlock(ACHIEVEMENT_MAP.get("champion")!);
    if (level >= 100) await tryUnlock(ACHIEVEMENT_MAP.get("apex")!);

    // ── Meta / Collector ─────────────────────────────────────────────────────

    // Evaluate collector/master/completionist based on the count AFTER new unlocks
    const totalUnlocked = unlockedIds.size;
    if (totalUnlocked >= 10) await tryUnlock(ACHIEVEMENT_MAP.get("collector")!);
    if (totalUnlocked >= 25) await tryUnlock(ACHIEVEMENT_MAP.get("master")!);
    if (totalUnlocked >= ACHIEVEMENTS.length - 1)
      await tryUnlock(ACHIEVEMENT_MAP.get("completionist")!);

    // ── Save & notify ────────────────────────────────────────────────────────

    for (const achievement of newlyUnlocked) {
      await gamificationService.notifyUser(userId, {
        title: "Achievement Unlocked: " + achievement.name,
        body: achievement.description,
        tag: "achievement-" + achievement.id
      });
    }

    // Bonus XP from these unlocks can cross level or collector thresholds.
    if (newlyUnlocked.length)
      newlyUnlocked.push(...(await gamificationService.checkAchievements(userId)));
    return newlyUnlocked;
  },

  // ── Share Progress ──────────────────────────────────────────────────────────

  shareProgress: (userId: string) =>
    summarizeReward(userId, async () => {
      const today = await getUserToday(userId);
      const newAchievements: Achievement[] = [];
      if (await unlockAchievement(userId, "social_proof", today))
        newAchievements.push(ACHIEVEMENT_MAP.get("social_proof")!);
      newAchievements.push(...(await gamificationService.checkAchievements(userId)));
      return { xpAwarded: 0, newAchievements };
    }),

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
      achievementTotal: ACHIEVEMENTS.length,
      brokenStreak: restoreInfo(profile).brokenStreak,
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

  useStreakFreeze: (userId: string) =>
    summarizeReward(userId, () => gamificationService.buyStreakFreeze(userId)),

  buyStreakFreeze: async (userId: string) => {
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
    const newAchievements: Achievement[] = [];
    if (await unlockAchievement(userId, "wise_spender", await getUserToday(userId)))
      newAchievements.push(
        ACHIEVEMENT_MAP.get("wise_spender")!,
        ...(await gamificationService.checkAchievements(userId))
      );
    const current = (await UserGameProfileModel.findOne({ userId })) ?? profile;

    return {
      gems: current.gems,
      streakFreezes: current.streakFreezes,
      xpAwarded: 0,
      newAchievements
    };
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

  // Without an endpoint (older clients) every device is unsubscribed.
  unsubscribePush: async (userId: string, endpoint?: string) => {
    await PushSubscriptionModel.deleteMany(
      endpoint ? { userId, endpoint } : { userId }
    );
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
export const handleHabitLogXP = (
  userId: string,
  habit: { _id: Types.ObjectId; type: string } & Parameters<
    typeof completed
  >[0],
  previous?: RewardLog,
  next?: RewardLog
): Promise<RewardSummary> =>
  summarizeReward(userId, () => applyHabitLogXP(userId, habit, previous, next));

const applyHabitLogXP = async (
  userId: string,
  habit: { _id: Types.ObjectId; type: string } & Parameters<
    typeof completed
  >[0],
  previous?: RewardLog,
  next?: RewardLog
) => {
  // Logging today counts as showing up: check in so the login streak and its
  // badges work even for users who never press "Check in".
  let checkin: CheckinResult | null = null;
  if (next && next.date === (await getUserToday(userId))) {
    const result = await gamificationService.claimCheckin(userId);
    if (!result.alreadyCheckedIn) checkin = result;
  }
  const logResult = await applyLogXP(userId, habit, previous, next);
  return {
    ...logResult,
    // Check-in XP is reported in `checkin`, so clients don't show it twice.
    xpAwarded: logResult.xpAwarded,
    newAchievements: [...(checkin?.newAchievements ?? []), ...logResult.newAchievements],
    checkin
  };
};

const applyLogXP = async (
  userId: string,
  habit: { _id: Types.ObjectId; type: string } & Parameters<
    typeof completed
  >[0],
  previous?: RewardLog,
  next?: RewardLog
): Promise<{ xpAwarded: number; newAchievements: Achievement[]; legendaryDay: boolean }> => {
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
      : { xpAwarded: 0, newAchievements: [] as Achievement[] };
  if (!next || !completed(habit, next))
    return {
      xpAwarded: result.xpAwarded,
      newAchievements: result.newAchievements,
      legendaryDay: false
    };
  let legendaryDay = false;

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
        legendaryDay = bonus.xpAwarded > 0;
        result.newAchievements = [
          ...result.newAchievements,
          ...bonus.newAchievements
        ];
      }
    }
  }

  return {
    xpAwarded: result.xpAwarded,
    newAchievements: result.newAchievements,
    legendaryDay
  };
};
