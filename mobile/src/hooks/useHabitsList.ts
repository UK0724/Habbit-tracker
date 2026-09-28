import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { habitApi, type PulseHabitListItem } from "../services/api";

/**
 * One query (and one cache entry) for Today, the Habits list and reminder
 * scheduling: all habits including archived, with `date`'s log attached.
 */
export const habitsListKey = (date: string) => ["habits", "list", date] as const;

/**
 * At midnight the key changes; the previous day's list stays as placeholder
 * data (`isPlaceholderData`) until the new day loads, so cards are not
 * unmounted mid-edit. Callers treat placeholder data as read-only.
 */
export const useHabitsList = (date: string, enabled = true) =>
  useQuery<PulseHabitListItem[]>({
    queryKey: habitsListKey(date),
    queryFn: () => habitApi.list({ date, includeArchived: true }),
    enabled,
    placeholderData: keepPreviousData
  });
