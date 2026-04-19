import { useQuery } from "@tanstack/react-query";

import { getHabitStats } from "../services/statsApi";

export const useHabitStats = (habitId?: string) =>
  useQuery({
    queryKey: ["habit-stats", habitId],
    queryFn: () => getHabitStats(habitId as string),
    enabled: Boolean(habitId)
  });
