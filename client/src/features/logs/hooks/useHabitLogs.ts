import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

import type { SaveHabitLogInput } from "../../../shared/types/habit";
import { applyReward } from "../../gamification/rewards";
import {
  createHabitLog,
  deleteHabitLog,
  getHabitLogs,
  updateHabitLog
} from "../services/logsApi";

/** Copy for the XP toast that follows a successful log change. */
type Feedback = { title?: string; undoTitle?: string };

type SaveLogVariables = {
  habitId: string;
  logId?: string;
  input: SaveHabitLogInput;
  feedback?: Feedback;
};

type DeleteLogVariables = {
  habitId: string;
  logId: string;
  feedback?: Feedback;
};

const invalidateLogQueries = async (
  queryClient: QueryClient,
  habitId: string
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["insights"] }),
    queryClient.invalidateQueries({ queryKey: ["habits"] }),
    queryClient.invalidateQueries({ queryKey: ["habit-logs", habitId] }),
    queryClient.invalidateQueries({ queryKey: ["habit", habitId] })
  ]);
};

export const useHabitLogs = (habitId?: string, limit = 12) =>
  useQuery({
    queryKey: ["habit-logs", habitId, limit],
    queryFn: () => getHabitLogs(habitId as string, limit),
    enabled: Boolean(habitId)
  });

export const useSaveHabitLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, logId, input }: SaveLogVariables) =>
      logId
        ? updateHabitLog(habitId, logId, input)
        : createHabitLog(habitId, input),
    onSuccess: async (data, variables) => {
      // Handled here (not in the caller) so feedback survives unmounts.
      applyReward(queryClient, data?.reward, variables.feedback);
      await invalidateLogQueries(queryClient, variables.habitId);
    }
  });
};

export const useDeleteHabitLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, logId }: DeleteLogVariables) =>
      deleteHabitLog(habitId, logId),
    onSuccess: async (data, variables) => {
      applyReward(queryClient, data.reward, variables.feedback);
      await invalidateLogQueries(queryClient, variables.habitId);
    }
  });
};
