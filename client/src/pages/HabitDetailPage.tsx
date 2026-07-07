import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { TrendBadge } from "../components/ui/TrendBadge";
import { ContributionGrid } from "../components/viz/ContributionGrid";
import { CountUp } from "../components/viz/CountUp";
import { ProgressRing } from "../components/viz/ProgressRing";
import { Sparkline } from "../components/viz/Sparkline";
import { StreakFlame } from "../components/viz/StreakFlame";
import { useHabit } from "../features/habits/hooks/useHabits";
import { RecentEntriesList } from "../features/logs/components/RecentEntriesList";
import { useHabitLogs } from "../features/logs/hooks/useHabitLogs";
import {
  buildActionAnalytics,
  buildContributionGrid,
  buildMeasurableAnalytics
} from "../features/stats/lib/analytics";
import { formatShortDateLabel } from "../shared/lib/date";
import { getHabitHex } from "../shared/lib/habitTheme";
import { formatValueWithUnit } from "../shared/lib/utils";

const MetricCard = ({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`rounded-3xl border border-border-app bg-surface p-5 shadow-sm ${className ?? ""}`}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
      {label}
    </p>
    <div className="mt-2">{children}</div>
  </div>
);

export const HabitDetailPage = () => {
  const { id } = useParams();
  const habitQuery = useHabit(id);
  const logsQuery = useHabitLogs(id, 180);

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const habit = habitQuery.data;

  const actionAnalytics = useMemo(
    () => (habit?.type === "action" ? buildActionAnalytics(logs) : null),
    [habit?.type, logs]
  );
  const measurableAnalytics = useMemo(
    () =>
      habit && habit.type !== "action" ? buildMeasurableAnalytics(logs) : null,
    [habit, logs]
  );
  const grid = useMemo(() => buildContributionGrid(logs, 18), [logs]);

  if (habitQuery.isLoading) {
    return <div className="surface-card shimmer h-96 bg-surface/80" />;
  }

  if (habitQuery.isError || !habit) {
    return (
      <SectionCard title="Unable to load habit">
        <p className="text-sm text-rose-600">
          {habitQuery.error?.message ?? "This habit could not be found."}
        </p>
      </SectionCard>
    );
  }

  const hex = getHabitHex(habit.color);
  const isExpense = habit.type === "expense";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          habit.type === "action"
            ? "Action habit"
            : habit.type === "expense"
              ? "Expense habit"
              : "Measurable habit"
        }
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

      {/* ---- Action analytics ---- */}
      {habit.type === "action" && actionAnalytics ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[auto,1fr]">
            <SectionCard className="flex flex-col items-center justify-center gap-3">
              <ProgressRing
                value={actionAnalytics.completionRate}
                size={150}
                stroke={13}
                color={hex.base}
                trackColor="rgba(120,130,150,0.18)"
              >
                <span className="text-3xl font-bold text-content">
                  <CountUp
                    value={Math.round(actionAnalytics.completionRate * 100)}
                    suffix="%"
                  />
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-content-subtle">
                  Done rate
                </span>
              </ProgressRing>
              <p className="text-sm font-semibold text-content-muted">
                {actionAnalytics.totalDone} of {actionAnalytics.totalLogged}{" "}
                logged days
              </p>
            </SectionCard>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="Current streak">
                <div className="flex items-center gap-3">
                  <StreakFlame
                    count={actionAnalytics.currentStreak}
                    size={40}
                  />
                  <p className="text-3xl font-bold text-content">
                    <CountUp value={actionAnalytics.currentStreak} />
                    <span className="ml-1 text-base font-semibold text-content-subtle">
                      day{actionAnalytics.currentStreak === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
              </MetricCard>

              <MetricCard label="Longest streak">
                <p className="text-3xl font-bold text-content">
                  <CountUp value={actionAnalytics.longestStreak} />
                  <span className="ml-1 text-base font-semibold text-content-subtle">
                    day{actionAnalytics.longestStreak === 1 ? "" : "s"}
                  </span>
                </p>
              </MetricCard>

              <MetricCard label="Total completed">
                <p className="text-3xl font-bold text-content">
                  <CountUp value={actionAnalytics.totalDone} />
                </p>
              </MetricCard>

              <MetricCard label="Last 30 days">
                <p className="text-3xl font-bold text-content">
                  <CountUp value={actionAnalytics.last30Done} />
                  <span className="ml-1 text-base font-semibold text-content-subtle">
                    / 30
                  </span>
                </p>
              </MetricCard>
            </div>
          </div>

          <SectionCard
            title="Consistency heatmap"
            description="Every square is a day. Filled squares are days you showed up."
          >
            <ContributionGrid
              columns={grid.columns}
              mode="action"
              baseColor={hex.base}
            />
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-content-subtle">
              <span>Less</span>
              <span className="h-3 w-3 rounded-[3px] bg-surface-3" />
              <span
                className="h-3 w-3 rounded-[3px]"
                style={{ background: hex.soft }}
              />
              <span
                className="h-3 w-3 rounded-[3px]"
                style={{ background: hex.base }}
              />
              <span>More</span>
            </div>
          </SectionCard>
        </>
      ) : null}

      {/* ---- Measurable / Expense analytics ---- */}
      {habit.type !== "action" && measurableAnalytics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isExpense ? (
              <MetricCard label="Total spent">
                <p className="text-2xl font-bold text-content">
                  {formatValueWithUnit(measurableAnalytics.total, habit.unit)}
                </p>
                <p className="mt-1 text-xs font-medium text-content-muted">
                  across {measurableAnalytics.entries} payment
                  {measurableAnalytics.entries === 1 ? "" : "s"}
                </p>
              </MetricCard>
            ) : null}
            <MetricCard label={isExpense ? "Last entry" : "Latest"}>
              <p className="text-2xl font-bold text-content">
                {measurableAnalytics.latest !== null ? (
                  <CountUp
                    value={measurableAnalytics.latest}
                    decimals={
                      Number.isInteger(measurableAnalytics.latest) ? 0 : 2
                    }
                    suffix={habit.unit ? ` ${habit.unit}` : ""}
                  />
                ) : (
                  "—"
                )}
              </p>
              <div className="mt-2">
                <TrendBadge
                  trend={measurableAnalytics.trend}
                  label={
                    measurableAnalytics.trend === "none"
                      ? "No trend yet"
                      : measurableAnalytics.trend
                  }
                />
              </div>
            </MetricCard>
            <MetricCard label="Average">
              <p className="text-2xl font-bold text-content">
                {measurableAnalytics.average !== null
                  ? formatValueWithUnit(
                      Number(measurableAnalytics.average.toFixed(2)),
                      habit.unit
                    )
                  : "—"}
              </p>
            </MetricCard>
            <MetricCard label={isExpense ? "Highest" : "Best"}>
              <p className="text-2xl font-bold text-content">
                {measurableAnalytics.max !== null
                  ? formatValueWithUnit(measurableAnalytics.max, habit.unit)
                  : "—"}
              </p>
            </MetricCard>
            <MetricCard label="Entries">
              <p className="text-2xl font-bold text-content">
                <CountUp value={measurableAnalytics.entries} />
              </p>
            </MetricCard>
          </div>

          <SectionCard
            title={isExpense ? "Spending over time" : "Trend over time"}
            description={
              isExpense
                ? "Each amount you logged, oldest to most recent."
                : "Your logged values from oldest to most recent."
            }
          >
            <Sparkline
              data={measurableAnalytics.series.map((point) => point.value)}
              color={hex.base}
              height={140}
            />
            {measurableAnalytics.series.length ? (
              <div className="mt-3 flex justify-between text-xs font-semibold text-content-subtle">
                <span>
                  {formatShortDateLabel(measurableAnalytics.series[0]!.date)}
                </span>
                <span>
                  {formatShortDateLabel(
                    measurableAnalytics.series[
                      measurableAnalytics.series.length - 1
                    ]!.date
                  )}
                </span>
              </div>
            ) : null}
          </SectionCard>
        </>
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
                className="shimmer h-20 rounded-2xl bg-surface-3"
              />
            ))}
          </div>
        ) : logs.length ? (
          <RecentEntriesList
            habitType={habit.type}
            unit={habit.unit}
            logs={logs.slice(0, 12)}
          />
        ) : (
          <EmptyState
            title="No logs yet"
            description="Start logging this habit from the Today page to see history and analytics here."
            actionHref="/"
            actionLabel="Back to Today"
          />
        )}
      </SectionCard>
    </div>
  );
};
