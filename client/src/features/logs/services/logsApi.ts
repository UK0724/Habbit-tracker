import { apiRequest } from "../../../services/api";
import type { HabitLog, SaveHabitLogInput } from "../../../shared/types/habit";
import type { RewardSummary } from "../../gamification/rewards";

/** Log responses carry the server's reward summary (absent on old servers). */
export type HabitLogWithReward = HabitLog & { reward?: RewardSummary | null };

export const getHabitLogs = (habitId: string, limit = 12) =>
  apiRequest<HabitLog[]>(
    `/habits/${habitId}/logs?limit=${encodeURIComponent(limit.toString())}`
  );

export const createHabitLog = (habitId: string, input: SaveHabitLogInput) =>
  apiRequest<HabitLogWithReward>(`/habits/${habitId}/logs`, {
    method: "POST",
    body: JSON.stringify(input)
  });

export const updateHabitLog = (
  habitId: string,
  logId: string,
  input: SaveHabitLogInput
) =>
  apiRequest<HabitLogWithReward>(`/habits/${habitId}/logs/${logId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });

/** Undo a completion or a skip. Older servers answer 204 (no reward). */
export const deleteHabitLog = async (habitId: string, logId: string) => {
  const data = await apiRequest<{ reward?: RewardSummary | null } | undefined>(
    `/habits/${habitId}/logs/${logId}`,
    { method: "DELETE" }
  );
  return { reward: data?.reward ?? null };
};
