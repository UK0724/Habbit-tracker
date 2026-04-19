import { apiRequest } from "../../../services/api";
import type {
  HabitLog,
  SaveHabitLogInput,
  TodayLogEntry
} from "../../../shared/types/habit";

export const getHabitLogs = (habitId: string, limit = 12) =>
  apiRequest<HabitLog[]>(
    `/habits/${habitId}/logs?limit=${encodeURIComponent(limit.toString())}`
  );

export const createHabitLog = (habitId: string, input: SaveHabitLogInput) =>
  apiRequest<HabitLog>(`/habits/${habitId}/logs`, {
    method: "POST",
    body: JSON.stringify(input)
  });

export const updateHabitLog = (
  habitId: string,
  logId: string,
  input: SaveHabitLogInput
) =>
  apiRequest<HabitLog>(`/habits/${habitId}/logs/${logId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });

export const getTodayLogs = () => apiRequest<TodayLogEntry[]>("/logs/today");
