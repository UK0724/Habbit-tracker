import { useQuery } from "@tanstack/react-query";
import { getHabitStats } from "../services/statsApi";
export const useHabitStats = (habitId) => useQuery({
    queryKey: ["habit-stats", habitId],
    queryFn: () => getHabitStats(habitId),
    enabled: Boolean(habitId)
});
