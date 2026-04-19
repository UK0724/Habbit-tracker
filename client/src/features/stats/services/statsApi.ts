import { apiRequest } from "../../../services/api";
import type { HabitStats } from "../../../shared/types/habit";

export const getHabitStats = (habitId: string) =>
  apiRequest<HabitStats>(`/habits/${habitId}/stats`);
