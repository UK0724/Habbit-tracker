import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionCard } from "../components/ui/SectionCard";
import { DailyLogTable } from "../features/habits/components/DailyLogTable";
import { useHabits } from "../features/habits/hooks/useHabits";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import { useSaveHabitLog } from "../features/logs/hooks/useHabitLogs";
import { formatDateLabel, isToday } from "../shared/lib/date";
import type { ActionStatus } from "../shared/types/habit";

export const HomePage = () => {
  const selectedDate = useHomeDateStore((state) => state.selectedDate);
  const setSelectedDate = useHomeDateStore((state) => state.setSelectedDate);
  const shiftSelectedDate = useHomeDateStore((state) => state.shiftSelectedDate);
  const resetSelectedDate = useHomeDateStore((state) => state.resetSelectedDate);

  const habitsQuery = useHabits(selectedDate);
  const saveLogMutation = useSaveHabitLog();
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);

  const handleSaveAction = async (
    habitId: string,
    logId: string | undefined,
    status: ActionStatus
  ) => {
    try {
      setActiveHabitId(habitId);
      await saveLogMutation.mutateAsync({
        habitId,
        logId,
        input: {
          date: selectedDate,
          status
        }
      });
    } finally {
      setActiveHabitId(null);
    }
  };

  const handleSaveValue = async (
    habitId: string,
    logId: string | undefined,
    value: number
  ) => {
    try {
      setActiveHabitId(habitId);
      await saveLogMutation.mutateAsync({
        habitId,
        logId,
        input: {
          date: selectedDate,
          value
        }
      });
    } finally {
      setActiveHabitId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard className="border border-slate-200">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Daily log
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Update habits in one place
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Pick any date, fill each row, and backfill missed entries without
              jumping between oversized cards.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {isToday(selectedDate)
                  ? "Editing today"
                  : `Backfilling ${formatDateLabel(selectedDate)}`}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                One row per habit
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-xl flex-col gap-3 lg:items-end">
            <div className="grid w-full gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-[auto,1fr,auto,auto] sm:items-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => shiftSelectedDate(-1)}
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-10 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => shiftSelectedDate(1)}
                className="w-full sm:w-auto"
              >
                Next
              </Button>
              {!isToday(selectedDate) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetSelectedDate}
                  className="w-full sm:w-auto"
                >
                  Today
                </Button>
              ) : null}
            </div>

            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link to="/habits/new">Create habit</Link>
            </Button>
          </div>
        </div>
      </SectionCard>

      {saveLogMutation.error ? (
        <SectionCard className="border border-rose-200 bg-rose-50/60">
          <p className="text-sm font-medium text-rose-700">
            {saveLogMutation.error.message}
          </p>
        </SectionCard>
      ) : null}

      {habitsQuery.isLoading ? (
        <SectionCard
          title={`Habits for ${formatDateLabel(selectedDate)}`}
          description="Loading your daily log..."
        >
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse border-b border-slate-100 bg-slate-50/80 last:border-b-0"
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {habitsQuery.isError ? (
        <SectionCard title="Unable to load habits">
          <p className="text-sm text-rose-700">{habitsQuery.error.message}</p>
        </SectionCard>
      ) : null}

      {!habitsQuery.isLoading &&
      !habitsQuery.isError &&
      !habitsQuery.data?.length ? (
        <EmptyState
          title="No habits created yet"
          description="Create your first habit to start logging action-based check-ins or measurable daily values."
          actionHref="/habits/new"
          actionLabel="Create your first habit"
        />
      ) : null}

      {!habitsQuery.isLoading &&
      !habitsQuery.isError &&
      habitsQuery.data?.length ? (
        <SectionCard
          title={`Habits for ${formatDateLabel(selectedDate)}`}
          description={
            isToday(selectedDate)
              ? "Action habits save immediately. Measurable habits save when you press Save."
              : "Missed a day? Fill the rows below and the selected date updates right away."
          }
        >
          <DailyLogTable
            habits={habitsQuery.data}
            selectedDate={selectedDate}
            savingHabitId={
              saveLogMutation.isPending ? activeHabitId : null
            }
            onSaveAction={handleSaveAction}
            onSaveValue={handleSaveValue}
          />
        </SectionCard>
      ) : null}
    </div>
  );
};
