// ─── Level Thresholds ────────────────────────────────────────────────────────
// Index = level-1, value = total XP needed to reach that level.
// Level 1 = 0 XP (everyone starts here)
// Level 10 = 4500, then ~15% increase per level up to level 100

const buildThresholds = (): number[] => {
  const fixed = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4500];
  const thresholds = [...fixed];
  let current = 4500;
  for (let i = 10; i < 100; i++) {
    current = Math.round(current * 1.15);
    thresholds.push(current);
  }
  return thresholds;
};

export const LEVEL_THRESHOLDS: number[] = buildThresholds();

// ─── Level Titles ─────────────────────────────────────────────────────────────

export const LEVEL_TITLES: string[] = [
  "Beginner", // 1
  "Getting Started", // 2
  "Consistent", // 3
  "Building Habits", // 4
  "Dedicated", // 5
  "On Track", // 6
  "Focused", // 7
  "Determined", // 8
  "Motivated", // 9
  "Disciplined", // 10
  "Rising Star", // 11
  "Goal Getter", // 12
  "Self-Improver", // 13
  "Persistent", // 14
  "Unstoppable", // 15
  "On Fire", // 16
  "Habit Forger", // 17
  "Streak Keeper", // 18
  "Daily Driver", // 19
  "Reliable", // 20
  "Committed", // 21
  "Serious", // 22
  "Hard Worker", // 23
  "Iron Minded", // 24
  "Warrior", // 25
  "Battle-Tested", // 26
  "Veteran", // 27
  "Seasoned", // 28
  "Expert", // 29
  "Elite", // 30
  "Master Class", // 31
  "Pro", // 32
  "Accomplished", // 33
  "High Achiever", // 34
  "Champion", // 35
  "Contender", // 36
  "Top Performer", // 37
  "All-Star", // 38
  "Legend in Making", // 39
  "Legendary", // 40
  "Mythic", // 41
  "Transcendent", // 42
  "Enlightened", // 43
  "Awakened", // 44
  "Ascendant", // 45
  "Titan", // 46
  "Colossus", // 47
  "Giant", // 48
  "Behemoth", // 49
  "Grand Champion", // 50
  "Trailblazer", // 51
  "Pathfinder", // 52
  "Luminary", // 53
  "Virtuoso", // 54
  "Maestro", // 55
  "Sage", // 56
  "Visionary", // 57
  "Pioneer", // 58
  "Stalwart", // 59
  "Grandmaster", // 60
  "Warlord", // 61
  "Commander", // 62
  "General", // 63
  "Admiral", // 64
  "Marshal", // 65
  "Grand Marshal", // 66
  "Overlord", // 67
  "Sovereign", // 68
  "Emperor", // 69
  "Deity", // 70
  "Immortal", // 71
  "Eternal", // 72
  "Infinite", // 73
  "Boundless", // 74
  "Supreme", // 75
  "Omega", // 76
  "Ultimate", // 77
  "Absolute", // 78
  "Primordial", // 79
  "Cosmic", // 80
  "Galactic", // 81
  "Universal", // 82
  "Omnipotent", // 83
  "Omniscient", // 84
  "Omnipresent", // 85
  "Radiant", // 86
  "Supernal", // 87
  "Celestial", // 88
  "Divine", // 89
  "Godlike", // 90
  "Ethereal", // 91
  "Astral", // 92
  "Elysian", // 93
  "Empyrean", // 94
  "Seraphic", // 95
  "Cherubic", // 96
  "Angelic", // 97
  "Archangel", // 98
  "Paragon", // 99
  "Apex" // 100
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Returns the level (1-100) for a given total XP. */
export const getLevelFromXP = (xp: number): number => {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && xp >= threshold) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, 100);
};

/** Returns the total XP needed to reach the NEXT level. Returns Infinity at max level. */
export const getXPForNextLevel = (level: number): number => {
  if (level >= 100) return Infinity;
  return LEVEL_THRESHOLDS[level] ?? Infinity; // LEVEL_THRESHOLDS[level] is threshold for level+1
};

// ─── XP Rewards ──────────────────────────────────────────────────────────────

export const XP_REWARDS = {
  ACTION_COMPLETE: 10,
  MEASURABLE_HIT: 15,
  MEASURABLE_LOGGED: 5,
  LEGENDARY_DAY: 25,
  STREAK_BONUS_7: 30,
  STREAK_BONUS_14: 50,
  STREAK_BONUS_30: 100,
  STREAK_BONUS_100: 300,
  STREAK_BONUS_365: 1000,
  CHECKIN: 5,
  ACHIEVEMENT_BRONZE: 50,
  ACHIEVEMENT_SILVER: 100,
  ACHIEVEMENT_GOLD: 200,
  ACHIEVEMENT_PLATINUM: 500
} as const;

// ─── Gem Rewards ─────────────────────────────────────────────────────────────
// Gems buy streak freezes (2 gems each). Earned from achievements by tier and
// from login-streak milestones.

export const GEM_REWARDS = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 5,
  STREAK_MILESTONE: 1
} as const;

/** Gems to restore a broken login streak, allowed for 24h after the break. */
export const STREAK_RESTORE_COST = 5;
export const STREAK_RESTORE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Repairing one habit's missed day: 1 streak freeze, or this many gems. */
export const STREAK_REPAIR_GEM_COST = 3;
/** How many days back a missed habit day can be repaired. */
export const STREAK_REPAIR_WINDOW_DAYS = 2;

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";
export type AchievementCategory =
  | "beginner"
  | "streak"
  | "performance"
  | "consistency"
  | "levels"
  | "special";

export interface AchievementDefinition {
  emoji: string;
  id: string;
  name: string;
  description: string;
  xpBonus: number;
  tier: AchievementTier;
  category: AchievementCategory;
}

export type Achievement = AchievementDefinition & { gemBonus: number };

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ── Beginner ──
  {
    id: "first_step",
    emoji: "👣",
    name: "First Step",
    description: "Log your very first habit entry.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "beginner"
  },
  {
    id: "early_bird",
    emoji: "🌅",
    name: "Early Bird",
    description: "Log a habit before 8 AM.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "beginner"
  },
  {
    id: "night_owl",
    emoji: "🦉",
    name: "Night Owl",
    description: "Log a habit after 10 PM.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "beginner"
  },
  {
    id: "getting_started",
    emoji: "🌱",
    name: "Getting Started",
    description: "Log habits on 3 different days.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "beginner"
  },
  {
    id: "creator",
    emoji: "✨",
    name: "Creator",
    description: "Create your first habit.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "beginner"
  },
  // ── Streak ──
  {
    id: "on_fire",
    emoji: "🔥",
    name: "On Fire",
    description: "Maintain a 7-day login streak.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "streak"
  },
  {
    id: "unstoppable",
    emoji: "⚡",
    name: "Unstoppable",
    description: "Maintain a 14-day login streak.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "streak"
  },
  {
    id: "diamond_streak",
    emoji: "💎",
    name: "Diamond Streak",
    description: "Maintain a 30-day login streak.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "streak"
  },
  {
    id: "century",
    emoji: "💯",
    name: "Century",
    description: "Maintain a 100-day login streak.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "streak"
  },
  {
    id: "legend",
    emoji: "🌌",
    name: "Legend",
    description: "Maintain a 365-day login streak.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_PLATINUM,
    tier: "platinum",
    category: "streak"
  },
  // ── Performance ──
  {
    id: "perfect_day",
    emoji: "🏆",
    name: "Perfect Day",
    description: "Complete all habits in a single day.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "performance"
  },
  {
    id: "legendary_week",
    emoji: "👑",
    name: "Legendary Week",
    description: "Complete all habits every day for 7 consecutive days.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "performance"
  },
  {
    id: "speedrunner",
    emoji: "⏱️",
    name: "Speedrunner",
    description: "Log 5 habits in a single day.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "performance"
  },
  {
    id: "goal_crusher",
    emoji: "🎯",
    name: "Goal Crusher",
    description: "Hit the target on a measurable habit 10 times.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "performance"
  },
  {
    id: "overachiever",
    emoji: "🚀",
    name: "Overachiever",
    description: "Earn 1000 XP in a single day.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "performance"
  },
  // ── Consistency ──
  {
    id: "dedicated",
    emoji: "💪",
    name: "Dedicated",
    description: "Log 50 total habit entries.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "consistency"
  },
  {
    id: "centurion",
    emoji: "⚔️",
    name: "Centurion",
    description: "Log 100 total habit entries.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "consistency"
  },
  {
    id: "veteran",
    emoji: "🎖️",
    name: "Veteran",
    description: "Log 500 total habit entries.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_PLATINUM,
    tier: "platinum",
    category: "consistency"
  },
  {
    id: "no_excuses",
    emoji: "🚫",
    name: "No Excuses",
    description: "Complete at least one habit 14 days in a row.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "consistency"
  },
  {
    id: "iron_will",
    emoji: "🏋️",
    name: "Iron Will",
    description: "Complete at least one habit 30 days in a row.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "consistency"
  },
  // ── Levels ──
  {
    id: "rising_star",
    emoji: "🌟",
    name: "Rising Star",
    description: "Reach level 10.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "levels"
  },
  {
    id: "warrior",
    emoji: "🤺",
    name: "Warrior",
    description: "Reach level 25.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "levels"
  },
  {
    id: "champion",
    emoji: "🥇",
    name: "Champion",
    description: "Reach level 50.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "levels"
  },
  {
    id: "apex",
    emoji: "🦁",
    name: "Apex",
    description: "Reach level 100 — the maximum.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_PLATINUM,
    tier: "platinum",
    category: "levels"
  },
  // ── Special ──
  {
    id: "comeback_kid",
    emoji: "🦅",
    name: "Comeback Kid",
    description: "Check in again after losing a streak.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "special"
  },
  {
    id: "wise_spender",
    emoji: "🛡️",
    name: "Wise Spender",
    description: "Use a streak freeze to protect your streak.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "special"
  },
  {
    id: "collector",
    emoji: "🗃️",
    name: "Collector",
    description: "Unlock 10 achievements.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_SILVER,
    tier: "silver",
    category: "special"
  },
  {
    id: "master",
    emoji: "🔮",
    name: "Master",
    description: "Unlock 25 achievements.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_GOLD,
    tier: "gold",
    category: "special"
  },
  {
    id: "completionist",
    emoji: "🌠",
    name: "Completionist",
    description: "Unlock every other achievement.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_PLATINUM,
    tier: "platinum",
    category: "special"
  },
  {
    id: "second_chance",
    emoji: "❄️",
    name: "Second Chance",
    description: "Repair a habit's streak with a freeze or gems.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "special"
  },
  {
    id: "social_proof",
    emoji: "📣",
    name: "Social Proof",
    description: "Share your progress with the world.",
    xpBonus: XP_REWARDS.ACHIEVEMENT_BRONZE,
    tier: "bronze",
    category: "special"
  }
];

export const ACHIEVEMENTS: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => ({
  ...def,
  gemBonus: GEM_REWARDS[def.tier]
}));

export const ACHIEVEMENT_MAP = new Map<string, Achievement>(
  ACHIEVEMENTS.map((a) => [a.id, a])
);
