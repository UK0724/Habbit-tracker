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
    percent: Math.min(100, Math.max(0, ((xp - current) / span) * 100)),
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
  // ── Bronze (beginner) ──
  {
    id: "first_step",
    name: "First Step",
    description: "Log your very first habit entry.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "👣",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Log a habit before 8 AM.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "🌅",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Log a habit after 10 PM.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "🦉",
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Log habits on 3 different days.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "🌱",
  },
  {
    id: "creator",
    name: "Creator",
    description: "Create your first habit.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "✨",
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Restore a broken streak by watching an ad.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "🦅",
  },
  {
    id: "wise_spender",
    name: "Wise Spender",
    description: "Use a streak freeze to protect your streak.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "🛡️",
  },
  {
    id: "social_proof",
    name: "Social Proof",
    description: "Share your progress with the world.",
    xpBonus: 50,
    tier: "bronze",
    emoji: "📣",
  },

  // ── Silver (intermediate) ──
  {
    id: "on_fire",
    name: "On Fire",
    description: "Maintain a 7-day login streak.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🔥",
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Maintain a 14-day login streak.",
    xpBonus: 100,
    tier: "silver",
    emoji: "⚡",
  },
  {
    id: "perfect_day",
    name: "Perfect Day",
    description: "Complete all habits in a single day.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🏆",
  },
  {
    id: "speedrunner",
    name: "Speedrunner",
    description: "Log 5 habits in a single day.",
    xpBonus: 100,
    tier: "silver",
    emoji: "⏱️",
  },
  {
    id: "goal_crusher",
    name: "Goal Crusher",
    description: "Hit the target on a measurable habit 10 times.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🎯",
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Log 50 total habit entries.",
    xpBonus: 100,
    tier: "silver",
    emoji: "💪",
  },
  {
    id: "no_excuses",
    name: "No Excuses",
    description: "Check in for 14 consecutive days without skipping.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🚫",
  },
  {
    id: "rising_star",
    name: "Rising Star",
    description: "Reach level 10.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🌟",
  },
  {
    id: "collector",
    name: "Collector",
    description: "Unlock 10 achievements.",
    xpBonus: 100,
    tier: "silver",
    emoji: "🗃️",
  },

  // ── Gold (advanced) ──
  {
    id: "diamond_streak",
    name: "Diamond Streak",
    description: "Maintain a 30-day login streak.",
    xpBonus: 250,
    tier: "gold",
    emoji: "💎",
  },
  {
    id: "century",
    name: "Century",
    description: "Maintain a 100-day login streak.",
    xpBonus: 250,
    tier: "gold",
    emoji: "💯",
  },
  {
    id: "legendary_week",
    name: "Legendary Week",
    description: "Complete all habits every day for 7 consecutive days.",
    xpBonus: 250,
    tier: "gold",
    emoji: "👑",
  },
  {
    id: "overachiever",
    name: "Overachiever",
    description: "Earn 1000 XP in a single day.",
    xpBonus: 250,
    tier: "gold",
    emoji: "🚀",
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Log 100 total habit entries.",
    xpBonus: 250,
    tier: "gold",
    emoji: "⚔️",
  },
  {
    id: "iron_will",
    name: "Iron Will",
    description: "Check in for 30 consecutive days without skipping.",
    xpBonus: 250,
    tier: "gold",
    emoji: "🛡️",
  },
  {
    id: "warrior",
    name: "Warrior",
    description: "Reach level 25.",
    xpBonus: 250,
    tier: "gold",
    emoji: "🤺",
  },
  {
    id: "champion",
    name: "Champion",
    description: "Reach level 50.",
    xpBonus: 250,
    tier: "gold",
    emoji: "🥇",
  },
  {
    id: "master",
    name: "Master",
    description: "Unlock 25 achievements.",
    xpBonus: 250,
    tier: "gold",
    emoji: "🔮",
  },

  // ── Platinum (elite) ──
  {
    id: "legend",
    name: "Legend",
    description: "Maintain a 365-day login streak.",
    xpBonus: 500,
    tier: "platinum",
    emoji: "🌌",
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Log 500 total habit entries.",
    xpBonus: 500,
    tier: "platinum",
    emoji: "🎖️",
  },
  {
    id: "apex",
    name: "Apex",
    description: "Reach level 100 — the maximum.",
    xpBonus: 500,
    tier: "platinum",
    emoji: "🦁",
  },
  {
    id: "completionist",
    name: "Completionist",
    description: "Unlock all 30 achievements.",
    xpBonus: 500,
    tier: "platinum",
    emoji: "🌠",
  },
];

export const ACHIEVEMENT_MAP = new Map<string, AchievementDef>(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

// Fallback emoji lookup by keyword / ID
const EMOJI_FALLBACKS: Record<string, string> = {
  first_log: "👣",
  first_step: "👣",
  early_bird: "🌅",
  night_owl: "🦉",
  getting_started: "🌱",
  creator: "✨",
  streak_3: "🚲",
  streak_7: "🔥",
  on_fire: "🔥",
  streak_14: "💪",
  unstoppable: "⚡",
  streak_30: "🌙",
  diamond_streak: "💎",
  streak_60: "🧙",
  streak_100: "💎",
  century: "💯",
  streak_365: "🎖️",
  legend: "🌌",
  perfect_day: "🏆",
  legendary_first: "🏆",
  legendary_5: "✋",
  legendary_20: "👑",
  legendary_100: "🌌",
  legendary_week: "👑",
  speedrunner: "⏱️",
  measurable_first: "📊",
  measurable_target_10: "🎯",
  goal_crusher: "🎯",
  measurable_target_50: "🏹",
  dedicated: "💪",
  centurion: "⚔️",
  veteran: "🎖️",
  no_excuses: "🚫",
  iron_will: "🛡️",
  level_5: "⭐",
  level_10: "🌟",
  rising_star: "🌟",
  level_20: "🚀",
  level_25: "🤺",
  warrior: "🤺",
  level_30: "⚡",
  level_50: "🥇",
  champion: "🥇",
  level_100: "🦁",
  apex: "🦁",
  comeback_kid: "🦅",
  restore_streak: "🦅",
  wise_spender: "🛡️",
  collector: "🗃️",
  master: "🔮",
  completionist: "🌠",
  social_proof: "📣",
  five_habits: "🗂️",
  ten_habits: "🗃️",
  first_skip: "🙈",
  xp_500: "🌱",
  xp_2000: "📈",
  xp_10000: "💫",
  xp_50000: "🌠",
  overachiever: "🚀",
};

export const getAchievementEmoji = (id: string, defEmoji?: string): string => {
  if (defEmoji) return defEmoji;
  const match = ACHIEVEMENT_MAP.get(id);
  if (match?.emoji) return match.emoji;
  if (EMOJI_FALLBACKS[id]) return EMOJI_FALLBACKS[id];
  return "⭐";
};
