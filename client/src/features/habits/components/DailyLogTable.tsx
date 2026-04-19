import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { NumberInput } from "../../../components/ui/NumberInput";
import { formatShortDateLabel } from "../../../shared/lib/date";
import { getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn, formatValueWithUnit } from "../../../shared/lib/utils";
import type { ActionStatus, HabitListItem } from "../../../shared/types/habit";

type DailyLogTableProps = {
  habits: HabitListItem[];
  selectedDate: string;
  savingHabitId: string | null;
  onSaveAction: (
    habitId: string,
    logId: string | undefined,
    status: ActionStatus
  ) => Promise<void> | void;
  onSaveValue: (
    habitId: string,
    logId: string | undefined,
    value: number
  ) => Promise<void> | void;
};

const actionButtonClassName =
  "inline-flex min-w-28 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

const statusText = {
  done: "Done",
  not_done: "Not done"
} as const;

const getActionEntryLabel = (
  status: ActionStatus | null | undefined,
  selectedDate: string
) => {
  if (status === "done") {
    return `Marked done for ${formatShortDateLabel(selectedDate)}`;
  }

  if (status === "not_done") {
    return `Marked not done for ${formatShortDateLabel(selectedDate)}`;
  }

  return `No entry yet for ${formatShortDateLabel(selectedDate)}`;
};

const getMeasurableEntryLabel = (
  value: number | null | undefined,
  unit: string | undefined,
  selectedDate: string
) => {
  if (value === null || value === undefined) {
    return `No value yet for ${formatShortDateLabel(selectedDate)}`;
  }

  return `Saved ${formatValueWithUnit(value, unit)} for ${formatShortDateLabel(selectedDate)}`;
};

const HabitIdentity = ({
  habit,
  compact = false
}: {
  habit: HabitListItem;
  compact?: boolean;
}) => {
  const theme = getHabitTheme(habit.color);

  return (
    <div className="flex items-start gap-3">
      <span className={cn("mt-1 h-3 w-3 rounded-full", theme.accent)} />

      <div className="min-w-0">
        <Link
          to={`/habits/${habit.id}`}
          className="text-base font-semibold text-slate-950 transition hover:text-indigo-700"
        >
          {habit.title}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
              theme.soft
            )}
          >
            {habit.type === "action" ? "Action" : "Measurable"}
          </span>
          {habit.unit ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
              {habit.unit}
            </span>
          ) : null}
        </div>

        {habit.description ? (
          <p
            className={cn(
              "mt-2 text-sm leading-6 text-slate-500",
              compact ? "" : "max-w-md"
            )}
          >
            {habit.description}
          </p>
        ) : null}
      </div>
    </div>
  );
};

const HabitNameCell = ({ habit }: { habit: HabitListItem }) => (
  <td className="px-4 py-4 align-top">
    <HabitIdentity habit={habit} />
  </td>
);

const ActionSummary = ({
  stats
}: {
  stats:
    | Extract<HabitListItem["stats"], { type: "action" }>
    | null;
}) => (
  <div className="space-y-1 text-sm">
    <p className="font-semibold text-slate-900">
      {stats
        ? `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"} streak`
        : "No streak yet"}
    </p>
    <p className="text-slate-500">
      {stats?.lastCompletedDate
        ? `Last completed ${formatShortDateLabel(stats.lastCompletedDate)}`
        : "No completed day yet"}
    </p>
  </div>
);

const MeasurableSummary = ({
  stats,
  unit
}: {
  stats:
    | Extract<HabitListItem["stats"], { type: "measurable" }>
    | null;
  unit?: string;
}) => (
  <div className="space-y-1 text-sm">
    <p className="font-semibold text-slate-900">
      {stats?.latestValue !== null && stats?.latestValue !== undefined
        ? `Latest ${formatValueWithUnit(stats.latestValue, unit)}`
        : "No values yet"}
    </p>
    <p className="text-slate-500">
      {stats?.previousValue !== null && stats?.previousValue !== undefined
        ? `Previous ${formatValueWithUnit(stats.previousValue, unit)}`
        : "No previous value yet"}
    </p>
    <p className="text-slate-500">
      {stats?.differenceLabel ?? "Add another value to see a trend"}
    </p>
  </div>
);

const ActionHabitRow = ({
  habit,
  isSaving,
  selectedDate,
  onSave
}: {
  habit: HabitListItem;
  isSaving: boolean;
  selectedDate: string;
  onSave: (
    habitId: string,
    logId: string | undefined,
    status: ActionStatus
  ) => Promise<void> | void;
}) => {
  const theme = getHabitTheme(habit.color);
  const currentStatus = habit.selectedDateLog?.status;
  const stats = habit.stats.type === "action" ? habit.stats : null;

  return (
    <tr className="bg-white">
      <HabitNameCell habit={habit} />

      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap gap-2">
          {(["done", "not_done"] as const).map((status) => {
            const isActive = currentStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  void onSave(habit.id, habit.selectedDateLog?.id, status)
                }
                disabled={isSaving}
                className={cn(
                  actionButtonClassName,
                  isActive
                    ? status === "done"
                      ? cn("border-transparent text-white", theme.button)
                      : "border-rose-600 bg-rose-600 text-white focus-visible:ring-rose-200"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-200"
                )}
              >
                {isSaving && isActive ? "Saving..." : statusText[status]}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-xs font-medium text-slate-500">
          {getActionEntryLabel(currentStatus, selectedDate)}
        </p>
      </td>

      <td className="px-4 py-4 align-top">
        <ActionSummary stats={stats} />
      </td>

      <td className="px-4 py-4 text-right align-top">
        <Link
          to={`/habits/${habit.id}`}
          className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
        >
          Details
        </Link>
      </td>
    </tr>
  );
};

const MeasurableHabitRow = ({
  habit,
  isSaving,
  selectedDate,
  onSave
}: {
  habit: HabitListItem;
  isSaving: boolean;
  selectedDate: string;
  onSave: (
    habitId: string,
    logId: string | undefined,
    value: number
  ) => Promise<void> | void;
}) => {
  const stats = habit.stats.type === "measurable" ? habit.stats : null;
  const [value, setValue] = useState(
    habit.selectedDateLog?.value?.toString() ?? ""
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setValue(habit.selectedDateLog?.value?.toString() ?? "");
    setLocalError(null);
  }, [habit.selectedDateLog?.id, habit.selectedDateLog?.value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericValue = Number(value);

    if (!value.trim().length || Number.isNaN(numericValue)) {
      setLocalError("Enter a valid number.");
      return;
    }

    setLocalError(null);
    void onSave(habit.id, habit.selectedDateLog?.id, numericValue);
  };

  return (
    <tr className="bg-white">
      <HabitNameCell habit={habit} />

      <td className="px-4 py-4 align-top">
        <form
          onSubmit={handleSubmit}
          className="flex min-w-[280px] flex-wrap items-start gap-2"
        >
          <div className="min-w-[180px] flex-1">
            <NumberInput
              value={value}
              unit={habit.unit}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Enter value"
              className="h-11 rounded-xl"
            />
          </div>

          <Button type="submit" size="sm" disabled={isSaving} className="h-11">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </form>

        <p className="mt-2 text-xs font-medium text-slate-500">
          {getMeasurableEntryLabel(
            habit.selectedDateLog?.value,
            habit.unit,
            selectedDate
          )}
        </p>

        {localError ? (
          <p className="mt-2 text-xs font-medium text-rose-600">
            {localError}
          </p>
        ) : null}
      </td>

      <td className="px-4 py-4 align-top">
        <MeasurableSummary stats={stats} unit={habit.unit} />
      </td>

      <td className="px-4 py-4 text-right align-top">
        <Link
          to={`/habits/${habit.id}`}
          className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
        >
          Details
        </Link>
      </td>
    </tr>
  );
};

const MobileCardShell = ({
  habit,
  children
}: {
  habit: HabitListItem;
  children: ReactNode;
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <HabitIdentity habit={habit} compact />
      <Link
        to={`/habits/${habit.id}`}
        className="shrink-0 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
      >
        Details
      </Link>
    </div>
    {children}
  </article>
);

const MobileActionHabitCard = ({
  habit,
  isSaving,
  selectedDate,
  onSave
}: {
  habit: HabitListItem;
  isSaving: boolean;
  selectedDate: string;
  onSave: (
    habitId: string,
    logId: string | undefined,
    status: ActionStatus
  ) => Promise<void> | void;
}) => {
  const theme = getHabitTheme(habit.color);
  const currentStatus = habit.selectedDateLog?.status;
  const stats = habit.stats.type === "action" ? habit.stats : null;

  return (
    <MobileCardShell habit={habit}>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["done", "not_done"] as const).map((status) => {
          const isActive = currentStatus === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() =>
                void onSave(habit.id, habit.selectedDateLog?.id, status)
              }
              disabled={isSaving}
              className={cn(
                actionButtonClassName,
                "min-w-0 px-3",
                isActive
                  ? status === "done"
                    ? cn("border-transparent text-white", theme.button)
                    : "border-rose-600 bg-rose-600 text-white focus-visible:ring-rose-200"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-200"
              )}
            >
              {isSaving && isActive ? "Saving..." : statusText[status]}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500">
        {getActionEntryLabel(currentStatus, selectedDate)}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Streak
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {stats
              ? `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`
              : "No streak yet"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Last completed
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {stats?.lastCompletedDate
              ? formatShortDateLabel(stats.lastCompletedDate)
              : "No completed day"}
          </p>
        </div>
      </div>
    </MobileCardShell>
  );
};

const MobileMeasurableHabitCard = ({
  habit,
  isSaving,
  selectedDate,
  onSave
}: {
  habit: HabitListItem;
  isSaving: boolean;
  selectedDate: string;
  onSave: (
    habitId: string,
    logId: string | undefined,
    value: number
  ) => Promise<void> | void;
}) => {
  const stats = habit.stats.type === "measurable" ? habit.stats : null;
  const [value, setValue] = useState(
    habit.selectedDateLog?.value?.toString() ?? ""
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setValue(habit.selectedDateLog?.value?.toString() ?? "");
    setLocalError(null);
  }, [habit.selectedDateLog?.id, habit.selectedDateLog?.value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericValue = Number(value);

    if (!value.trim().length || Number.isNaN(numericValue)) {
      setLocalError("Enter a valid number.");
      return;
    }

    setLocalError(null);
    void onSave(habit.id, habit.selectedDateLog?.id, numericValue);
  };

  return (
    <MobileCardShell habit={habit}>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <NumberInput
          value={value}
          unit={habit.unit}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Enter value"
          className="h-11 rounded-xl"
        />

        <Button type="submit" disabled={isSaving} className="w-full" size="sm">
          {isSaving ? "Saving..." : "Save value"}
        </Button>
      </form>

      <p className="mt-3 text-xs font-medium text-slate-500">
        {getMeasurableEntryLabel(
          habit.selectedDateLog?.value,
          habit.unit,
          selectedDate
        )}
      </p>

      {localError ? (
        <p className="mt-2 text-xs font-medium text-rose-600">{localError}</p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Latest
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {stats?.latestValue !== null && stats?.latestValue !== undefined
              ? formatValueWithUnit(stats.latestValue, habit.unit)
              : "No values yet"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Trend
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {stats?.differenceLabel ?? "Add another value to see a trend"}
          </p>
        </div>
      </div>
    </MobileCardShell>
  );
};

export const DailyLogTable = ({
  habits,
  selectedDate,
  savingHabitId,
  onSaveAction,
  onSaveValue
}: DailyLogTableProps) => (
  <div className="space-y-4">
    <div className="grid gap-3 md:hidden">
      {habits.map((habit) =>
        habit.type === "action" ? (
          <MobileActionHabitCard
            key={habit.id}
            habit={habit}
            selectedDate={selectedDate}
            isSaving={savingHabitId === habit.id}
            onSave={onSaveAction}
          />
        ) : (
          <MobileMeasurableHabitCard
            key={habit.id}
            habit={habit}
            selectedDate={selectedDate}
            isSaving={savingHabitId === habit.id}
            onSave={onSaveValue}
          />
        )
      )}
    </div>

    <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white md:block">
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Habit</th>
              <th className="px-4 py-3">
                Entry for {formatShortDateLabel(selectedDate)}
              </th>
              <th className="px-4 py-3">Summary</th>
              <th className="px-4 py-3 text-right">Open</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {habits.map((habit) =>
              habit.type === "action" ? (
                <ActionHabitRow
                  key={habit.id}
                  habit={habit}
                  selectedDate={selectedDate}
                  isSaving={savingHabitId === habit.id}
                  onSave={onSaveAction}
                />
              ) : (
                <MeasurableHabitRow
                  key={habit.id}
                  habit={habit}
                  selectedDate={selectedDate}
                  isSaving={savingHabitId === habit.id}
                  onSave={onSaveValue}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
