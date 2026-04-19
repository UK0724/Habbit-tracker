import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createHabit, deleteHabit, getHabit, getHabits, updateHabit } from "../services/habitsApi";
const invalidateHabitCollections = async (queryClient, habitId) => {
    await Promise.all([
        queryClient.invalidateQueries({
            queryKey: ["habits"]
        }),
        queryClient.invalidateQueries({
            queryKey: ["today-logs"]
        }),
        habitId
            ? queryClient.invalidateQueries({
                queryKey: ["habit", habitId]
            })
            : Promise.resolve(),
        habitId
            ? queryClient.invalidateQueries({
                queryKey: ["habit-stats", habitId]
            })
            : Promise.resolve(),
        habitId
            ? queryClient.invalidateQueries({
                queryKey: ["habit-logs", habitId]
            })
            : Promise.resolve()
    ]);
};
export const useHabits = (date) => useQuery({
    queryKey: ["habits", date],
    queryFn: () => getHabits(date)
});
export const useHabit = (id) => useQuery({
    queryKey: ["habit", id],
    queryFn: () => getHabit(id),
    enabled: Boolean(id)
});
export const useCreateHabit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input) => createHabit(input),
        onSuccess: async (habit) => {
            await invalidateHabitCollections(queryClient, habit.id);
        }
    });
};
export const useUpdateHabit = (habitId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input) => updateHabit(habitId, input),
        onSuccess: async () => {
            await invalidateHabitCollections(queryClient, habitId);
        }
    });
};
export const useDeleteHabit = (habitId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => deleteHabit(habitId),
        onSuccess: async () => {
            await invalidateHabitCollections(queryClient);
            queryClient.removeQueries({
                queryKey: ["habit", habitId]
            });
        }
    });
};
