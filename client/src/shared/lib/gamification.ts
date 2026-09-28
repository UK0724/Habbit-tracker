// Levels, XP amounts and achievement definitions are server-owned; the client
// only renders what the API returns. What remains here is presentation-only.

// ─── Achievement types ──────────────────────────────────────────────────────
export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export type AchievementCategory =
  | "beginner"
  | "streak"
  | "performance"
  | "consistency"
  | "levels"
  | "special";

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
  if (EMOJI_FALLBACKS[id]) return EMOJI_FALLBACKS[id];
  return "⭐";
};
