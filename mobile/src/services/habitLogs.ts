import type { QueryClient } from "@tanstack/react-query";
import type { SaveHabitLogInput } from "@habit-tracker/shared";
import { ApiError, habitLogApi, type RewardedLog } from "./api";

export const CONFLICT_MESSAGE =
  "This habit was just updated somewhere else. Pull down to refresh, then try again.";

/** Server maximum for GET /habits/:id/logs?limit= (a year of daily logs). */
const LOG_LOOKUP_LIMIT = 366;

/**
 * Creates or updates the log for `payload.date`. On a 409 (the log changed
 * or already exists) or a 404 from an update (the log was deleted
 * elsewhere) it refreshes habit data, looks up the current log for that
 * date and retries exactly once (update if it exists, else create).
 */
export const saveHabitLog = async (
  queryClient: QueryClient,
  habitId: string,
  logId: string | undefined,
  payload: SaveHabitLogInput
): Promise<RewardedLog> => {
  const run = (id?: string) =>
    id
      ? habitLogApi.update(habitId, id, payload)
      : habitLogApi.create(habitId, payload);
  try {
    return await run(logId);
  } catch (error) {
    const retryable =
      error instanceof ApiError &&
      error.code !== "SESSION_CHANGED" &&
      (error.status === 409 || (error.status === 404 && Boolean(logId)));
    if (!retryable) throw error;
    await queryClient.invalidateQueries({ queryKey: ["habits"] });
    // Logs come newest first; a year covers any date the app can log.
    const logs = await habitLogApi.list(habitId, LOG_LOOKUP_LIMIT);
    const current = logs.find((log) => log.date === payload.date);
    try {
      return await run(current?.id);
    } catch (retryError) {
      if (
        retryError instanceof ApiError &&
        (retryError.status === 409 || (retryError.status === 404 && Boolean(current)))
      )
        throw new ApiError(CONFLICT_MESSAGE, 409, retryError.details);
      throw retryError;
    }
  }
};
