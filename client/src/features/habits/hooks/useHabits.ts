import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

import type {
  CreateHabitInput,
  UpdateHabitInput
} from "../../../shared/types/habit";
import {
  createHabit,
  deleteHabit,
  getHabit,
  getHabits,
  updateHabit
} from "../services/habitsApi";

const invalidateHabitCollections = async (
  queryClient: QueryClient,
  habitId?: string
) => {
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

export const useHabits = (date: string) =>
  useQuery({
    queryKey: ["habits", date],
    queryFn: () => getHabits(date)
  });

export const useHabit = (id?: string) =>
  useQuery({
    queryKey: ["habit", id],
    queryFn: () => getHabit(id as string),
    enabled: Boolean(id)
  });

export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input),
    onSuccess: async (habit) => {
      await invalidateHabitCollections(queryClient, habit.id);
    }
  });
};

export const useUpdateHabit = (habitId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateHabitInput) => updateHabit(habitId, input),
    onSuccess: async () => {
      await invalidateHabitCollections(queryClient, habitId);
    }
  });
};

export const useDeleteHabit = (habitId: string) => {
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
