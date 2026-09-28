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
  getArchivedHabits,
  getHabit,
  getHabits,
  repairHabitStreak,
  setHabitArchived,
  updateHabit
} from "../services/habitsApi";
import { pushToast } from "../../../stores/xpToastStore";
import {
  applyReward,
  invalidateGamification
} from "../../gamification/rewards";

const invalidateHabitCollections = async (
  queryClient: QueryClient,
  habitId?: string
) => {
  await Promise.all([
    queryClient.invalidateQueries({queryKey:["insights"]}),
    queryClient.invalidateQueries({
      queryKey: ["habits"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["archived-habits"]
    }),
    habitId
      ? queryClient.invalidateQueries({
          queryKey: ["habit", habitId]
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

export const useArchivedHabits = () =>
  useQuery({
    queryKey: ["archived-habits"],
    queryFn: getArchivedHabits
  });

export const useSetHabitArchived = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      setHabitArchived(id, archived),
    onSuccess: async (_data, variables) => {
      await invalidateHabitCollections(queryClient, variables.id);
    }
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) => createHabit(input),
    onSuccess: async (habit) => {
      await Promise.all([
        invalidateHabitCollections(queryClient, habit.id),
        // The first habit starts the streak (Day 1) server-side.
        invalidateGamification(queryClient)
      ]);
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

/** Excuse a missed day with a streak freeze (or gems) so the streak continues. */
export const useRepairStreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      habitId,
      date
    }: {
      habitId: string;
      date: string;
      /** For the confirmation toast. */
      gemCost?: number;
    }) =>
      repairHabitStreak(habitId, date),
    onSuccess: async (data, variables) => {
      // Celebrates badges such as Second Chance; no XP is awarded.
      applyReward(queryClient, data, { skipXpToast: true });
      pushToast({
        amount: data?.paidWith === "gems" ? -(variables.gemCost ?? 3) : -1,
        label: data?.paidWith === "gems" ? "💎" : "🛡️",
        title: "Streak repaired ❄️",
        tone: "gems"
      });
      await Promise.all([
        invalidateHabitCollections(queryClient, variables.habitId),
        invalidateGamification(queryClient)
      ]);
    },
    onError: async (_error, variables) => {
      // The offer may be stale (logged elsewhere, window passed): refresh it.
      await invalidateHabitCollections(queryClient, variables.habitId);
    }
  });
};
