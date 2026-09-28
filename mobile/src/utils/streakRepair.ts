/**
 * Pure helpers for the per-habit streak repair banner (no React Native
 * imports, so tests/streakRepair.check.cjs can load this file directly).
 */

export interface RepairOfferLike {
  date: string;
  freezeCost: number;
  gemCost: number;
}

export interface Wallet {
  streakFreezes?: number | null;
  gems?: number | null;
}

export type RepairPlan =
  | { payWith: "freeze"; cost: number; affordable: true; label: string; confirm: string }
  | { payWith: "gems"; cost: number; affordable: true; label: string; confirm: string }
  | { payWith: "gems"; cost: number; affordable: false; label: string; confirm: null };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const count = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

/** "Sat, Sep 26" for YYYY-MM-DD (noon, so no timezone shifts the day). */
export const repairDayLabel = (date: string) => {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date(NaN);
  if (Number.isNaN(parsed.getTime())) return date;
  return `${WEEKDAYS[parsed.getDay()]}, ${MONTHS[parsed.getMonth()]} ${parsed.getDate()}`;
};

/** "Streak broken on Sat, Sep 26" */
export const repairHeadline = (offer: Pick<RepairOfferLike, "date">) =>
  `Streak broken on ${repairDayLabel(offer.date)}`;

/**
 * How the repair would be paid, mirroring the server: a streak freeze when
 * the user has one, otherwise gems (disabled when there aren't enough).
 */
export const planRepair = (offer: RepairOfferLike, wallet: Wallet | null | undefined): RepairPlan => {
  const freezes = count(wallet?.streakFreezes);
  const gems = count(wallet?.gems);
  const freezeCost = Math.max(1, count(offer.freezeCost));
  const gemCost = Math.max(1, count(offer.gemCost));
  const day = repairDayLabel(offer.date);
  if (freezes >= freezeCost)
    return {
      payWith: "freeze",
      cost: freezeCost,
      affordable: true,
      label: `Repair for 🛡️${freezeCost}`,
      confirm: `Use ${freezeCost === 1 ? "1 streak freeze" : `${freezeCost} streak freezes`} to cover ${day}? Your streak continues. You have ${freezes}.`
    };
  if (gems >= gemCost)
    return {
      payWith: "gems",
      cost: gemCost,
      affordable: true,
      label: `Repair for 💎${gemCost}`,
      confirm: `Spend ${gemCost} gems to cover ${day}? Your streak continues. You have ${gems} gems.`
    };
  return {
    payWith: "gems",
    cost: gemCost,
    affordable: false,
    label: `Need 💎${gemCost} (you have ${gems})`,
    confirm: null
  };
};

/** Friendly copy for a failed repair (status from ApiError). */
export const repairErrorMessage = (status: number | undefined, serverMessage: string | undefined) => {
  if (status === 409) return "This day was just logged. We've refreshed your habit.";
  if (status === 400) {
    if (serverMessage && /freeze|gems/i.test(serverMessage)) return serverMessage;
    return "This day can't be repaired anymore. We've refreshed your habit.";
  }
  if (status === 404) return "This habit no longer exists.";
  return serverMessage || "Couldn't repair your streak. Please try again.";
};
