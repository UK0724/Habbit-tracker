import { useEffect, useState } from "react";
import { AppState } from "react-native";

const pad = (value: number) => String(value).padStart(2, "0");

/** The device's local calendar date as YYYY-MM-DD, computed at call time. */
export const localDateString = (date: Date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const msUntilNextMidnight = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
};

/**
 * The local date, kept current across midnight and app resume so screens
 * never log against a stale "today".
 */
export const useLocalDate = () => {
  const [today, setToday] = useState(localDateString);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => setToday(localDateString());
    const schedule = () => {
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, msUntilNextMidnight());
    };
    schedule();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
  return today;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Sep 28" from an ISO timestamp or YYYY-MM-DD; null if unparseable. */
export const shortDate = (value?: string | null) => {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

/** Single-letter-ish weekday label for a YYYY-MM-DD date. */
export const weekdayShort = (value: string) =>
  WEEKDAY_SHORT[new Date(`${value}T12:00:00`).getDay()] ?? "";

/** "5h 12m" style countdown until an ISO time; null once passed. */
export const timeLeft = (iso: string | null | undefined, now = Date.now()) => {
  if (!iso) return null;
  const ms = Date.parse(iso) - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${Math.max(1, minutes)}m`;
};
