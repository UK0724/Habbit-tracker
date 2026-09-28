import { apiRequest } from "../../../services/api";
import type { RewardSummary } from "../../gamification/rewards";
import type {
  CreateHabitInput,
  Habit,
  HabitListItem,
  UpdateHabitInput
} from "../../../shared/types/habit";

export const getHabits = (date: string) =>
  apiRequest<HabitListItem[]>(`/habits?date=${encodeURIComponent(date)}`);

export const getHabit = (id: string) => apiRequest<Habit>(`/habits/${id}`);

export const getArchivedHabits = () =>
  apiRequest<Habit[]>("/habits/archived");

export const setHabitArchived = (id: string, archived: boolean) =>
  apiRequest<Habit>(`/habits/${id}/archive`, {
    method: "PATCH",
    body: JSON.stringify({ archived })
  });

export const createHabit = (input: CreateHabitInput) =>
  apiRequest<Habit>("/habits", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const updateHabit = (id: string, input: UpdateHabitInput) =>
  apiRequest<Habit>(`/habits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });

export const deleteHabit = (id: string) =>
  apiRequest<void>(`/habits/${id}`, {
    method: "DELETE"
  });

export type StreakRepairResult = Partial<RewardSummary> & {
  paidWith: "freeze" | "gems";
  date: string;
  streakFreezes: number;
  gems: number;
};

/** Spend a streak freeze (or gems) to excuse the offered missed day. */
export const repairHabitStreak = (id: string, date: string) =>
  apiRequest<StreakRepairResult>(`/habits/${id}/streak-repair`, {
    method: "POST",
    body: JSON.stringify({ date })
  });
