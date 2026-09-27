import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { NumberInput } from "../../../components/ui/NumberInput";
import { StreakFlame } from "../../../components/viz/StreakFlame";
import { WeekDots } from "../../../components/viz/WeekDots";
import { formatShortDateLabel } from "../../../shared/lib/date";
import { getHabitHex, getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn, formatValueWithUnit } from "../../../shared/lib/utils";
import type { ActionStatus, HabitListItem } from "../../../shared/types/habit";

type DailyLogTableProps = {
  habits: HabitListItem[];
  selectedDate: string;
  savingHabitId: string | null;
  onSaveAction: (
    habitId: string,
    logId: string | undefined,
    status: ActionStatus,
    comment?: string
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
  skipped: "Skipped",
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
          className="text-base font-semibold text-content transition hover:text-accent"
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
            {habit.type === "action"
              ? "Action"
              : habit.type === "expense"
                ? "Expense"
                : "Measurable"}
          </span>
          {habit.linkToExpenseTracker ? (
            <Link
              to="/expenses"
              className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition ring-1 ring-emerald-500/30 flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              Open Expenses
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </Link>
          ) : null}
          {habit.unit ? (
            <span className="rounded-full bg-surface-3 px-2.5 py-1 text-xs font-semibold text-content-2 ring-1 ring-border-app">
              {habit.unit}
            </span>
          ) : null}
          {habit.requireCompletionComment ? (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/30">
              Comment on done
            </span>
          ) : null}
        </div>

        {habit.description ? (
          <p
            className={cn(
              "mt-2 text-sm leading-6 text-content-muted",
              compact ? "" : "max-w-md"
            )}
          >
            {habit.description}
          </p>
        ) : null}

        {habit.recentDays?.length ? (
          <div className="mt-3">
            <WeekDots
              days={habit.recentDays}
              mode={habit.type === "action" ? "action" : "measurable"}
              baseColor={getHabitHex(habit.color).base}
              showLabels={!compact}
            />
          </div>
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
  stats: Extract<HabitListItem["stats"], { type: "action" }> | null;
}) => (
  <div className="space-y-1 text-sm">
    <div className="flex items-center gap-2">
      <StreakFlame count={stats?.currentStreak ?? 0} size={24} />
      <p className="font-semibold text-content">
        {stats && stats.currentStreak > 0
          ? `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"} streak`
          : "No streak yet"}
      </p>
    </div>
    <p className="text-content-muted">
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
  stats: Extract<HabitListItem["stats"], { type: "measurable" }> | null;
  unit?: string;
}) => (
  <div className="space-y-1 text-sm">
    <p className="font-semibold text-content">
      {stats?.latestValue !== null && stats?.latestValue !== undefined
        ? `Latest ${formatValueWithUnit(stats.latestValue, unit)}`
        : "No values yet"}
    </p>
    <p className="text-content-muted">
      {stats?.previousValue !== null && stats?.previousValue !== undefined
        ? `Previous ${formatValueWithUnit(stats.previousValue, unit)}`
        : "No previous value yet"}
    </p>
    <p className="text-content-muted">
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
    status: ActionStatus,
    comment?: string
  ) => Promise<void> | void;
}) => {
  const theme = getHabitTheme(habit.color);
  const currentStatus = habit.selectedDateLog?.status;
  const currentComment = habit.selectedDateLog?.comment ?? "";
  const stats = habit.stats.type === "action" ? habit.stats : null;
  const [commentDraft, setCommentDraft] = useState(currentComment);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    setCommentDraft(currentComment);
    setCommentError(null);
  }, [currentComment, habit.selectedDateLog?.id]);

  const saveAction = (status: ActionStatus, comment?: string) => {
    void onSave(habit.id, habit.selectedDateLog?.id, status, comment);
  };

  const handleStatusClick = (status: ActionStatus) => {
    if (status === "done" && habit.requireCompletionComment) {
      setIsCommentOpen(true);
      return;
    }

    setCommentError(null);
    saveAction(status);
  };

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextComment = commentDraft.trim();

    if (!nextComment) {
      setCommentError("Add a quick comment before saving Done.");
      return;
    }

    setCommentError(null);
    saveAction("done", nextComment);
  };

  return (
    <tr className="bg-surface transition hover:bg-surface-2/60">
      <HabitNameCell habit={habit} />

      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap gap-2">
          {(["done", "not_done"] as const).map((status) => {
            const isActive = currentStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                disabled={isSaving}
                className={cn(
                  actionButtonClassName,
                  isActive
                    ? status === "done"
                      ? cn("border-transparent text-white", theme.button)
                      : "border-rose-600 bg-rose-600 text-white focus-visible:ring-rose-500/30"
                    : "border-border-app bg-surface text-content-2 hover:bg-surface-2 focus-visible:ring-border-app"
                )}
              >
                {isSaving && isActive ? "Saving..." : statusText[status]}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-xs font-medium text-content-muted">
          {getActionEntryLabel(currentStatus, selectedDate)}
        </p>

        {habit.requireCompletionComment && isCommentOpen ? (
          <form
            onSubmit={handleCommentSubmit}
            className="mt-3 max-w-lg rounded-2xl border border-accent/30 bg-accent-soft/60 p-3"
          >
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Completion comment
            </label>
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              rows={2}
              placeholder="Example: Applied to Product Designer at Acme"
              className="mt-2 w-full resize-none rounded-xl border border-accent/30 bg-surface px-3 py-2 text-sm text-content placeholder-slate-400 shadow-sm focus:border-accent/60 focus:ring-4 focus:ring-accent/30"
            />
            {commentError ? (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {commentError}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Done"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsCommentOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {currentStatus === "done" && habit.selectedDateLog?.comment ? (
          <p className="mt-2 max-w-md rounded-xl bg-surface-2 px-3 py-2 text-xs leading-5 text-content-2">
            {habit.selectedDateLog.comment}
          </p>
        ) : null}
      </td>

      <td className="px-4 py-4 align-top">
        <ActionSummary stats={stats} />
      </td>

      <td className="px-4 py-4 text-right align-top">
        <Link
          to={`/habits/${habit.id}`}
          className="text-sm font-semibold text-content-2 transition hover:text-content"
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
    <tr className="bg-surface transition hover:bg-surface-2/60">
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

        <p className="mt-2 text-xs font-medium text-content-muted">
          {getMeasurableEntryLabel(
            habit.selectedDateLog?.value,
            habit.unit,
            selectedDate
          )}
        </p>

        {localError ? (
          <p className="mt-2 text-xs font-medium text-rose-600">{localError}</p>
        ) : null}
      </td>

      <td className="px-4 py-4 align-top">
        <MeasurableSummary stats={stats} unit={habit.unit} />
      </td>

      <td className="px-4 py-4 text-right align-top">
        <Link
          to={`/habits/${habit.id}`}
          className="text-sm font-semibold text-content-2 transition hover:text-content"
        >
          Details
        </Link>
      </td>
    </tr>
  );
};

const MobileCardShell = ({
  habit,
  index = 0,
  children
}: {
  habit: HabitListItem;
  index?: number;
  children: ReactNode;
}) => (
  <article
    className="stagger-item rounded-3xl border border-border-app bg-surface p-4 shadow-sm"
    style={{ ["--stagger" as string]: index }}
  >
    <div className="flex items-start justify-between gap-3">
      <HabitIdentity habit={habit} compact />
      <Link
        to={`/habits/${habit.id}`}
        className="shrink-0 text-sm font-semibold text-content-2 transition hover:text-content"
      >
        Details
      </Link>
    </div>
    {children}
  </article>
);

const MobileActionHabitCard = ({
  habit,
  index,
  isSaving,
  selectedDate,
  onSave
}: {
  habit: HabitListItem;
  index: number;
  isSaving: boolean;
  selectedDate: string;
  onSave: (
    habitId: string,
    logId: string | undefined,
    status: ActionStatus,
    comment?: string
  ) => Promise<void> | void;
}) => {
  const theme = getHabitTheme(habit.color);
  const currentStatus = habit.selectedDateLog?.status;
  const currentComment = habit.selectedDateLog?.comment ?? "";
  const stats = habit.stats.type === "action" ? habit.stats : null;
  const [commentDraft, setCommentDraft] = useState(currentComment);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    setCommentDraft(currentComment);
    setCommentError(null);
  }, [currentComment, habit.selectedDateLog?.id]);

  const saveAction = (status: ActionStatus, comment?: string) => {
    void onSave(habit.id, habit.selectedDateLog?.id, status, comment);
  };

  const handleStatusClick = (status: ActionStatus) => {
    if (status === "done" && habit.requireCompletionComment) {
      setIsCommentOpen(true);
      return;
    }

    setCommentError(null);
    saveAction(status);
  };

  const handleCommentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextComment = commentDraft.trim();

    if (!nextComment) {
      setCommentError("Add a quick comment before saving Done.");
      return;
    }

    setCommentError(null);
    saveAction("done", nextComment);
  };

  return (
    <MobileCardShell habit={habit} index={index}>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(["done", "not_done"] as const).map((status) => {
          const isActive = currentStatus === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusClick(status)}
              disabled={isSaving}
              className={cn(
                actionButtonClassName,
                "min-w-0 px-3",
                isActive
                  ? status === "done"
                    ? cn("border-transparent text-white", theme.button)
                    : "border-rose-600 bg-rose-600 text-white focus-visible:ring-rose-500/30"
                  : "border-border-app bg-surface text-content-2 hover:bg-surface-2 focus-visible:ring-border-app"
              )}
            >
              {isSaving && isActive ? "Saving..." : statusText[status]}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-medium text-content-muted">
        {getActionEntryLabel(currentStatus, selectedDate)}
      </p>

      {habit.requireCompletionComment && isCommentOpen ? (
        <form
          onSubmit={handleCommentSubmit}
          className="mt-3 rounded-2xl border border-accent/30 bg-accent-soft/60 p-3"
        >
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Completion comment
          </label>
          <textarea
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            rows={3}
            placeholder="What did you complete?"
            className="mt-2 w-full resize-none rounded-xl border border-accent/30 bg-surface px-3 py-2 text-sm text-content placeholder-slate-400 shadow-sm focus:border-accent/60 focus:ring-4 focus:ring-accent/30"
          />
          {commentError ? (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {commentError}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Done"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsCommentOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {currentStatus === "done" && habit.selectedDateLog?.comment ? (
        <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs leading-5 text-content-2">
          {habit.selectedDateLog.comment}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-2 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">
            Streak
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <StreakFlame count={stats?.currentStreak ?? 0} size={20} />
            <p className="text-sm font-semibold text-content">
              {stats && stats.currentStreak > 0
                ? `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`
                : "None yet"}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">
            Last completed
          </p>
          <p className="mt-1 text-sm font-semibold text-content">
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
  index,
  isSaving,
  selectedDate,
  onSave
}: {
  habit: HabitListItem;
  index: number;
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
    <MobileCardShell habit={habit} index={index}>
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

      <p className="mt-3 text-xs font-medium text-content-muted">
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
        <div className="rounded-xl bg-surface-2 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">
            Latest
          </p>
          <p className="mt-1 text-sm font-semibold text-content">
            {stats?.latestValue !== null && stats?.latestValue !== undefined
              ? formatValueWithUnit(stats.latestValue, habit.unit)
              : "No values yet"}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-content-muted">
            Trend
          </p>
          <p className="mt-1 text-sm font-semibold text-content">
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
      {habits.map((habit, index) =>
        habit.type === "action" ? (
          <MobileActionHabitCard
            key={habit.id}
            habit={habit}
            index={index}
            selectedDate={selectedDate}
            isSaving={savingHabitId === habit.id}
            onSave={onSaveAction}
          />
        ) : (
          <MobileMeasurableHabitCard
            key={habit.id}
            habit={habit}
            index={index}
            selectedDate={selectedDate}
            isSaving={savingHabitId === habit.id}
            onSave={onSaveValue}
          />
        )
      )}
    </div>

    <div className="animate-fade-in-up hidden overflow-hidden rounded-3xl border border-border-app bg-surface shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full text-left">
          <thead className="bg-surface-3/70">
            <tr className="text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
              <th className="px-4 py-3">Habit</th>
              <th className="px-4 py-3">
                Entry for {formatShortDateLabel(selectedDate)}
              </th>
              <th className="px-4 py-3">Summary</th>
              <th className="px-4 py-3 text-right">Open</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border-app">
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
