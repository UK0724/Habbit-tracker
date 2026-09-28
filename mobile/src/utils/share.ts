/**
 * Pure helpers for the branded share card and its text fallback (no React
 * Native imports, so tests/share.check.cjs can load this file directly).
 */

export const APP_LINK = "https://habbit.abuk.in";
export const SHARE_FOOTER = "Build habits with me → habbit.abuk.in";

export type ShareContent =
  | { kind: "achievement"; achievement: { name: string; emoji?: string | null; description?: string | null } }
  | { kind: "levelUp"; level: number; title?: string | null }
  | { kind: "progress" };

/** The profile fields the card uses (all optional: the card must still render). */
export interface ShareProfile {
  level?: number | null;
  levelTitle?: string | null;
  loginStreak?: number | null;
  achievementCount?: number | null;
  achievementTotal?: number | null;
  totalXP?: number | null;
}

export interface ShareStat {
  label: string;
  value: string;
}

const num = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

/** 950 -> "950", 12_400 -> "12.4K", 1_250_000 -> "1.3M" (no Intl dependency). */
export const compactNumber = (value: number) => {
  const n = num(value);
  if (n < 10_000) return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (n < 1_000_000) return `${(Math.round(n / 100) / 10).toString().replace(/\.0$/, "")}K`;
  return `${(Math.round(n / 100_000) / 10).toString().replace(/\.0$/, "")}M`;
};

/** Level shown on the card: a level-up may arrive before the profile refetches. */
const cardLevel = (content: ShareContent, profile: ShareProfile | null | undefined) =>
  content.kind === "levelUp" ? Math.max(num(content.level), num(profile?.level)) : num(profile?.level);

const cardTitle = (content: ShareContent, profile: ShareProfile | null | undefined) =>
  (content.kind === "levelUp" && content.title ? content.title : profile?.levelTitle)?.trim() || "";

/** Big line on the card: "Unlocked Second Chance ❄️", "Reached Level 6 · On Track", "12-day streak 🔥". */
export const buildShareHeadline = (content: ShareContent, profile?: ShareProfile | null) => {
  if (content.kind === "achievement") {
    const emoji = content.achievement.emoji?.trim();
    return `Unlocked ${content.achievement.name.trim()}${emoji ? ` ${emoji}` : ""}`;
  }
  const level = cardLevel(content, profile);
  const title = cardTitle(content, profile);
  if (content.kind === "levelUp") return `Reached Level ${level}${title ? ` · ${title}` : ""}`;
  const streak = num(profile?.loginStreak);
  if (streak > 0) return `${streak}-day streak 🔥`;
  return level > 0 ? `Level ${level}${title ? ` · ${title}` : ""}` : "Building better habits";
};

/** Smaller line under the headline. */
export const buildShareSubline = (content: ShareContent, profile?: ShareProfile | null) => {
  if (content.kind === "achievement")
    return content.achievement.description?.trim() || "A new badge in my Trophy Room";
  if (content.kind === "levelUp") return "One habit at a time";
  const level = cardLevel(content, profile);
  const title = cardTitle(content, profile);
  return num(profile?.loginStreak) > 0 && level > 0
    ? `Level ${level}${title ? ` · ${title}` : ""}`
    : "Showing up every day";
};

/** Stats row: Level, Streak, Badges x/total, Total XP. */
export const buildShareStats = (content: ShareContent, profile?: ShareProfile | null): ShareStat[] => {
  const total = num(profile?.achievementTotal);
  const badges = num(profile?.achievementCount);
  return [
    { label: "Level", value: String(cardLevel(content, profile) || 1) },
    { label: "Streak", value: days(num(profile?.loginStreak)) },
    { label: "Badges", value: total > 0 ? `${Math.min(badges, total)}/${total}` : String(badges) },
    { label: "Total XP", value: compactNumber(num(profile?.totalXP)) }
  ];
};

/** Text used when an image can't be captured or shared (plus the app link). */
export const buildShareMessage = (content: ShareContent, profile?: ShareProfile | null) => {
  let text: string;
  if (content.kind === "achievement") {
    const emoji = content.achievement.emoji?.trim();
    text = `I just unlocked "${content.achievement.name.trim()}"${emoji ? ` ${emoji}` : ""} on Pulse!`;
  } else if (content.kind === "levelUp") {
    const title = content.title?.trim();
    text = `I just reached Level ${num(content.level)}${title ? ` (${title})` : ""} on Pulse!`;
  } else {
    const level = num(profile?.level);
    const title = profile?.levelTitle?.trim();
    const badges = num(profile?.achievementCount);
    text = `I'm Level ${level || 1}${title ? ` (${title})` : ""} on Pulse with a ${days(
      num(profile?.loginStreak)
    )} streak and ${badges} ${badges === 1 ? "badge" : "badges"}!`;
  }
  return `${text}\n${APP_LINK}`;
};

/** Letter shown when there's no profile photo. */
export const avatarInitial = (email?: string | null) => {
  const text = email?.trim() ?? "";
  const letter = text.match(/[A-Za-z0-9]/)?.[0] ?? Array.from(text)[0];
  return letter ? letter.toUpperCase() : "P";
};
