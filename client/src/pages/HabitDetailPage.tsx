import { Link, useParams } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { StatPill } from "../components/ui/StatPill";
import { TrendBadge } from "../components/ui/TrendBadge";
import { useHabit } from "../features/habits/hooks/useHabits";
import { RecentEntriesList } from "../features/logs/components/RecentEntriesList";
import { useHabitLogs } from "../features/logs/hooks/useHabitLogs";
import { useHabitStats } from "../features/stats/hooks/useHabitStats";
import { formatDateLabel, formatShortDateLabel } from "../shared/lib/date";
import { formatValueWithUnit } from "../shared/lib/utils";

export const HabitDetailPage = () => {
  const { id } = useParams();
  const habitQuery = useHabit(id);
  const statsQuery = useHabitStats(id);
  const logsQuery = useHabitLogs(id, 12);

  if (habitQuery.isLoading) {
    return <div className="surface-card h-96 animate-pulse bg-white/80" />;
  }

  if (habitQuery.isError || !habitQuery.data) {
    return (
      <SectionCard title="Unable to load habit">
        <p className="text-sm text-rose-700">
          {habitQuery.error?.message ?? "This habit could not be found."}
        </p>
      </SectionCard>
    );
  }

  const habit = habitQuery.data;
  const stats = statsQuery.data;
  const logs = logsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={habit.type === "action" ? "Action habit" : "Measurable habit"}
        title={habit.title}
        description={habit.description || "No description added yet."}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link to="/">Back to today</Link>
            </Button>
            <Button asChild>
              <Link to={`/habits/${habit.id}/edit`}>Edit habit</Link>
            </Button>
          </>
        }
      />

      {statsQuery.isError ? (
        <SectionCard>
          <p className="text-sm text-rose-700">{statsQuery.error.message}</p>
        </SectionCard>
      ) : null}

      {habit.type === "action" && stats && stats.type === "action" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <StatPill
            label="Current streak"
            value={`${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`}
            className="surface-card border-0 bg-white px-5 py-5 shadow-panel"
          />
          <StatPill
            label="Last completed"
            value={
              stats.lastCompletedDate
                ? formatDateLabel(stats.lastCompletedDate)
                : "No completed date yet"
            }
            className="surface-card border-0 bg-white px-5 py-5 shadow-panel"
          />
        </div>
      ) : null}

      {habit.type === "measurable" && stats && stats.type === "measurable" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatPill
            label="Latest value"
            value={
              stats.latestValue !== null
                ? formatValueWithUnit(stats.latestValue, habit.unit)
                : "No value yet"
            }
            className="surface-card border-0 bg-white px-5 py-5 shadow-panel"
          />
          <StatPill
            label="Previous value"
            value={
              stats.previousValue !== null
                ? formatValueWithUnit(stats.previousValue, habit.unit)
                : "No previous value"
            }
            className="surface-card border-0 bg-white px-5 py-5 shadow-panel"
          />
          <div className="surface-card flex flex-col justify-between px-5 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Trend
              </p>
              <div className="mt-3">
                <TrendBadge
                  trend={stats.trend}
                  label={stats.trend === "none" ? "No trend yet" : stats.trend}
                />
              </div>
            </div>
            <p className="mt-4 text-base font-bold text-slate-950">
              {stats.differenceLabel ?? "Add more entries to compare movement."}
            </p>
          </div>
        </div>
      ) : null}

      {habit.type === "action" ? (
        <SectionCard
          title="Recent status history"
          description="The latest action check-ins, with the freshest result first."
        >
          {logs.length ? (
            <div className="flex flex-wrap gap-3">
              {logs.slice(0, 7).map((log) => (
                <div
                  key={log.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    log.status === "done"
                      ? "border-emerald-100 bg-emerald-50"
                      : "border-rose-100 bg-rose-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {formatShortDateLabel(log.date)}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      log.status === "done"
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {log.status === "done" ? "Done" : "Not done"}
                  </p>
                  {log.comment ? (
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
                      {log.comment}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No logs yet"
              description="Start logging this habit from the Today page to see recent status history here."
              actionHref="/"
              actionLabel="Back to Today"
            />
          )}
        </SectionCard>
      ) : null}

      {habit.type === "measurable" && stats && stats.type === "measurable" ? (
        <SectionCard
          title="Trend snapshot"
          description="A simple view of the latest movement compared with the previous entry."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Latest</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {stats.latestValue !== null
                  ? formatValueWithUnit(stats.latestValue, habit.unit)
                  : "No value yet"}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">
                Change from previous
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {stats.differenceLabel ?? "Add another entry"}
              </p>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Recent entries"
        description={
          habit.requireCompletionComment
            ? "The latest saved daily logs, including completion comments."
            : "The latest saved daily logs for this habit."
        }
      >
        {logsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <RecentEntriesList habitType={habit.type} unit={habit.unit} logs={logs} />
        )}
      </SectionCard>
    </div>
  );
};
