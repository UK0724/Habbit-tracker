import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { useRewardCelebration } from "../../hooks/useRewardCelebration";
import {
  expenseApi,
  expenseKeys,
  type ExpenseInput,
  type SavedExpense
} from "../../services/expenses";

export const useExpenseList = () => {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...expenseKeys.list(), userId],
    queryFn: expenseApi.list,
    enabled: Boolean(userId)
  });
};

export const useBudgets = () => {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...expenseKeys.budgets, userId],
    queryFn: expenseApi.budgets,
    enabled: Boolean(userId)
  });
};

/**
 * Logging an expense can auto-complete a linked expense habit server-side
 * (workspaceSync), which awards XP; refresh everything that could change.
 */
const useRefreshAfterExpenseChange = () => {
  const queryClient = useQueryClient();
  return useCallback(
    () =>
      Promise.all(
        [expenseKeys.all, ["habits"], ["habit"], ["habitLogs"], ["habitStats"], ["gamificationProfile"], ["achievements"]].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey })
        )
      ),
    [queryClient]
  );
};

export const useSaveExpense = () => {
  const refresh = useRefreshAfterExpenseChange();
  const celebrate = useRewardCelebration();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ExpenseInput }): Promise<SavedExpense> =>
      id ? expenseApi.update(id, input) : expenseApi.create(input),
    onSuccess: (saved) => {
      if (saved?.reward) celebrate(saved.reward);
    },
    onSettled: () => {
      void refresh();
    }
  });
};

export const useDeleteExpense = () => {
  const refresh = useRefreshAfterExpenseChange();
  return useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSettled: () => {
      void refresh();
    }
  });
};

export const useSetBudgets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    /** Saves changed categories one by one; reports which ones failed. */
    mutationFn: async (changes: { category: string; monthlyLimit: number }[]) => {
      const failed: string[] = [];
      let firstError: unknown = null;
      for (const change of changes) {
        try {
          await expenseApi.setBudget(change.category, change.monthlyLimit);
        } catch (error) {
          failed.push(change.category);
          firstError ??= error;
        }
      }
      if (failed.length) {
        const error = firstError instanceof Error ? firstError : new Error("Could not save budgets.");
        throw Object.assign(error, { failed });
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.budgets });
    }
  });
};
