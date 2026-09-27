// ─── Level Thresholds ──────────────────────────────────────────────────────
// XP required to REACH level N (index 0 = level 1 threshold = 0)
export const LEVEL_THRESHOLDS: number[] = [
  0,       100,    250,    500,    900,    // 1-5
  1400,    2000,   2700,   3500,   4500,   // 6-10
  5700,    7100,   8700,   10500,  12500,  // 11-15
  14800,   17300,  20100,  23200,  26600,  // 16-20
  30600,   35100,  40200,  46000,  52500,  // 21-25
  60000,   68500,  78000,  88500,  100000, // 26-30
  113000,  127500, 143500, 161000, 180000, // 31-35
  201000,  224000, 249000, 276500, 306500, // 36-40
  339000,  374500, 413000, 455000, 500500, // 41-45
  549500,  602500, 659500, 721000, 787500, // 46-50
  859000,  936000, 1019000,1108500,1204500,// 51-55
  1307500, 1418000,1536500,1663500,1799000,// 56-60
  1944000, 2099500,2266000,2444000,2634000,// 61-65
  2837000, 3054000,3285500,3532500,3796000,// 66-70
  4077000, 4376000,4695000,5034000,5395500,// 71-75
  5780500, 6190000,6625500,7089000,7581000,// 76-80
  8104000, 8659000,9249000,9876500,10543000,// 81-85
  11250000,12002000,12800000,13647000,14547000,// 86-90
  15502000,16517000,17595000,18740000,19956000,// 91-95
  21247000,22617000,24070000,25610000,27244000, // 96-100
];

// ─── Level Titles ──────────────────────────────────────────────────────────
export const LEVEL_TITLES: string[] = [
  "Beginner",        "Getting Started",  "Consistent",      "Building Habits", "Dedicated",       // 1-5
  "On Track",        "Focused",          "Determined",      "Motivated",       "Disciplined",     // 6-10
  "Routine Seeker",  "Habit Builder",    "Self-Aware",      "Daily Doer",      "Momentum Maker",  // 11-15
  "Persistent",      "Goal Setter",      "Progress Chaser", "Steady Mover",    "Level-Headed",    // 16-20
  "Habit Warrior",   "Streak Hunter",    "Committed",       "Flow Finder",     "Power Player",    // 21-25
  "Ritual Keeper",   "High Performer",   "Excellence",      "Iron Will",       "Unstoppable",     // 26-30
  "Champion",        "Elite",            "Master",          "Virtuoso",        "Legend",          // 31-35
  "Ascendant",       "Transcendent",     "Enlightened",     "Chosen",          "Awakened",        // 36-40
  "Vanguard",        "Paragon",          "Titan",           "Colossus",        "Sovereign",       // 41-45
  "Archmage",        "Oracle",           "Celestial",       "Eternal",         "Immortal",        // 46-50
  "Mythic",          "Divine",           "Transcendent II", "Ascended",        "Radiant",         // 51-55
  "Luminous",        "Resplendent",      "Magnificent",     "Majestic",        "Exalted",         // 56-60
  "Heroic",          "Legendary",        "Grand Master",    "Supreme",         "Absolute",        // 61-65
  "Infinite",        "Boundless",        "Timeless",        "Ageless",         "Cosmic",          // 66-70
  "Galactic",        "Universal",        "Omnipotent",      "Omniscient",      "Omnipresent",     // 71-75
  "Transcendent III","Celestial II",     "Divine II",       "Mythic II",       "Immortal II",     // 76-80
  "Beyond",          "Ethereal",         "Astral",          "Primordial",      "Ancient",         // 81-85
  "Archaic",         "Primeval",         "Eternal II",      "Undying",         "Everlasting",     // 86-90
  "Infinite II",     "Boundless II",     "Timeless II",     "Ageless II",      "Cosmic II",       // 91-95
  "Grand Legend",    "Apex Predator",    "True Champion",   "One Above All",   "Apex",            // 96-100
];

// ─── Level helpers ─────────────────────────────────────────────────────────

/** Returns the 1-based level for a given XP total. */
export const getLevelFromXP = (xp: number): number => {
  let lo = 0;
  let hi = LEVEL_THRESHOLDS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (LEVEL_THRESHOLDS[mid]! <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1; // 1-based
};

export const getProgressToNextLevel = (xp: number) => {
  const level = getLevelFromXP(xp);
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[level - 1] ?? 0;
  const span = next - current || 1;
  return {
    level,
    title: LEVEL_TITLES[level - 1] ?? "Apex",
    currentXP: xp - current,
    neededXP: span,
    percent: Math.min(100, ((xp - current) / span) * 100),
  };
};

// ─── XP Rewards ────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  action_complete: 10,
  measurable_hit: 15,
  measurable_logged: 5,
  legendary_day: 25,
  streak_7: 5,
  streak_30: 10,
} as const;

// ─── Achievement types ──────────────────────────────────────────────────────
export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export type AchievementDef = {
  id: string;
  name: string;
  description: string;
  xpBonus: number;
  tier: AchievementTier;
  emoji: string;
};

// ─── Achievement definitions ────────────────────────────────────────────────
export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Bronze (beginner) ────────────────────────────────────────────────────
  {
    id: "first_log",
    name: "First Step",
    description: "Log your very first habit entry.",
    xpBonus: 25,
    tier: "bronze",
    emoji: "👣",
  },
  {
    id: "streak_3",
    name: "Tricycle",
    description: "Reach a 3-day streak on any habit.",
    xpBonus: 30,
    tier: "bronze",
    emoji: "🚲",
  },
  {
    id: "first_week",
    name: "One Week Wonder",
    description: "Log habits for 7 consecutive days.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "📅",
  },
  {
    id: "five_habits",
    name: "Habit Collector",
    description: "Create 5 different habits.",
    xpBonus: 40,
    tier: "bronze",
    emoji: "🗂️",
  },
  {
    id: "first_skip",
    name: "Honest Skipper",
    description: "Use the Skip option for the first time.",
    xpBonus: 10,
    tier: "bronze",
    emoji: "🙈",
  },
  {
    id: "measurable_first",
    name: "By the Numbers",
    description: "Log a measurable habit for the first time.",
    xpBonus: 20,
    tier: "bronze",
    emoji: "📊",
  },
  {
    id: "level_5",
    name: "Level 5 Reached",
    description: "Reach level 5.",
    xpBonus: 75,
    tier: "bronze",
    emoji: "⭐",
  },
  {
    id: "xp_500",
    name: "XP Rookie",
    description: "Earn 500 total XP.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "🌱",
  },

  // ── Silver (intermediate) ─────────────────────────────────────────────────
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak on any habit.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🔥",
  },
  {
    id: "legendary_first",
    name: "Legendary First",
    description: "Complete all habits in a single day.",
    xpBonus: 75,
    tier: "silver",
    emoji: "🏆",
  },
  {
    id: "xp_2000",
    name: "XP Climber",
    description: "Earn 2,000 total XP.",
    xpBonus: 100,
    tier: "silver",
    emoji: "📈",
  },
  {
    id: "level_10",
    name: "Level 10 Reached",
    description: "Reach level 10.",
    xpBonus: 150,
    tier: "silver",
    emoji: "🌟",
  },
  {
    id: "streak_14",
    name: "Two Week Titan",
    description: "Maintain a 14-day streak.",
    xpBonus: 120,
    tier: "silver",
    emoji: "💪",
  },
  {
    id: "ten_habits",
    name: "Habit Hoarder",
    description: "Create 10 different habits.",
    xpBonus: 80,
    tier: "silver",
    emoji: "🗃️",
  },
  {
    id: "legendary_5",
    name: "High Five Legend",
    description: "Achieve 5 legendary days.",
    xpBonus: 150,
    tier: "silver",
    emoji: "✋",
  },
  {
    id: "measurable_target_10",
    name: "Target Acquired",
    description: "Hit a measurable target 10 times.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🎯",
  },

  // ── Gold (advanced) ───────────────────────────────────────────────────────
  {
    id: "streak_30",
    name: "Monthly Warrior",
    description: "Maintain a 30-day streak on any habit.",
    xpBonus: 250,
    tier: "gold",
    emoji: "🌙",
  },
  {
    id: "xp_10000",
    name: "XP Legend",
    description: "Earn 10,000 total XP.",
    xpBonus: 300,
    tier: "gold",
    emoji: "💫",
  },
  {
    id: "level_20",
    name: "Level 20 Reached",
    description: "Reach level 20.",
    xpBonus: 400,
    tier: "gold",
    emoji: "🚀",
  },
  {
    id: "legendary_20",
    name: "Legend of Legends",
    description: "Achieve 20 legendary days.",
    xpBonus: 350,
    tier: "gold",
    emoji: "👑",
  },
  {
    id: "streak_60",
    name: "Sixty Day Sage",
    description: "Maintain a 60-day streak.",
    xpBonus: 400,
    tier: "gold",
    emoji: "🧙",
  },
  {
    id: "restore_streak",
    name: "Phoenix",
    description: "Restore a broken streak.",
    xpBonus: 50,
    tier: "gold",
    emoji: "🦅",
  },
  {
    id: "measurable_target_50",
    name: "Precision Master",
    description: "Hit a measurable target 50 times.",
    xpBonus: 250,
    tier: "gold",
    emoji: "🏹",
  },
  {
    id: "level_30",
    name: "Level 30 Reached",
    description: "Reach level 30.",
    xpBonus: 500,
    tier: "gold",
    emoji: "⚡",
  },

  // ── Platinum (elite) ──────────────────────────────────────────────────────
  {
    id: "streak_100",
    name: "Century Streak",
    description: "Maintain a 100-day streak on any habit.",
    xpBonus: 750,
    tier: "platinum",
    emoji: "💎",
  },
  {
    id: "xp_50000",
    name: "XP Grandmaster",
    description: "Earn 50,000 total XP.",
    xpBonus: 1000,
    tier: "platinum",
    emoji: "🌠",
  },
  {
    id: "level_50",
    name: "Level 50 Reached",
    description: "Reach level 50.",
    xpBonus: 1500,
    tier: "platinum",
    emoji: "🏅",
  },
  {
    id: "legendary_100",
    name: "True Legend",
    description: "Achieve 100 legendary days.",
    xpBonus: 1000,
    tier: "platinum",
    emoji: "🌌",
  },
  {
    id: "streak_365",
    name: "Year of Discipline",
    description: "Maintain a 365-day streak — the ultimate feat.",
    xpBonus: 2500,
    tier: "platinum",
    emoji: "🎖️",
  },
  {
    id: "level_100",
    name: "Apex",
    description: "Reach the maximum level. You are the ultimate habit champion.",
    xpBonus: 5000,
    tier: "platinum",
    emoji: "🦁",
  },
];
