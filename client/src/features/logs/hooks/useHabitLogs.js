import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTodayDateString } from "../../../shared/lib/date";
import { createHabitLog, getHabitLogs, getTodayLogs, updateHabitLog } from "../services/logsApi";
const invalidateLogQueries = async (queryClient, variables) => {
    await Promise.all([
        queryClient.invalidateQueries({
            queryKey: ["habits"]
        }),
        queryClient.invalidateQueries({
            queryKey: ["habit-logs", variables.habitId]
        }),
        queryClient.invalidateQueries({
            queryKey: ["habit-stats", variables.habitId]
        }),
        queryClient.invalidateQueries({
            queryKey: ["habit", variables.habitId]
        }),
        variables.input.date === getTodayDateString()
            ? queryClient.invalidateQueries({
                queryKey: ["today-logs"]
            })
            : Promise.resolve()
    ]);
};
export const useHabitLogs = (habitId, limit = 12) => useQuery({
    queryKey: ["habit-logs", habitId, limit],
    queryFn: () => getHabitLogs(habitId, limit),
    enabled: Boolean(habitId)
});
export const useTodayLogs = () => useQuery({
    queryKey: ["today-logs"],
    queryFn: () => getTodayLogs()
});
export const useSaveHabitLog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ habitId, logId, input }) => logId
            ? updateHabitLog(habitId, logId, input)
            : createHabitLog(habitId, input),
        onSuccess: async (_data, variables) => {
            await invalidateLogQueries(queryClient, variables);
        }
    });
};
