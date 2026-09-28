import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  BarChart2
} from "lucide-react";
import { apiRequest } from "../services/api";
import { getTodayDateString } from "../shared/lib/date";
import type { Habit } from "../shared/types/habit";
import { rulesAt, type summarize } from "../shared/lib/rules";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { cn } from "../shared/lib/utils";

type Insight = ReturnType<typeof summarize> & { habit: Habit };

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const InsightsPage = () => {
  const [days, setDays] = useState<7 | 30>(30);
  const today = getTodayDateString();

  const query = useQuery({
    queryKey: ["insights", days, today],
    queryFn: () => apiRequest<Insight[]>(`/insights?days=${days}&date=${today}`)
  });

  const insights = useMemo(() => query.data ?? [], [query.data]);

  // Macro Metrics Calculation
  const stats = useMemo(() => {
    if (!insights.length) {
      return {
        overallConsistency: 0,
        totalDone: 0,
        totalDue: 0,
        bestActiveStreak: 0,
        allTimeBestStreak: 0,
        dayOfWeekAdherence: [0, 0, 0, 0, 0, 0, 0]
      };
    }

    let totalDone = 0;
    let totalDue = 0;
    let bestActiveStreak = 0;
    let allTimeBestStreak = 0;

    const dayDone: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dayDue: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (const item of insights) {
      totalDone += item.done;
      totalDue += item.due;
      if (item.current > bestActiveStreak) bestActiveStreak = item.current;
      if (item.best > allTimeBestStreak) allTimeBestStreak = item.best;

      for (const cell of item.cells) {
        const d = new Date(cell.date + "T00:00:00");
        const dayIdx = d.getDay();
        if (dayIdx >= 0 && dayIdx < 7) {
          if (cell.state === "completed") {
            dayDone[dayIdx] = (dayDone[dayIdx] ?? 0) + 1;
            dayDue[dayIdx] = (dayDue[dayIdx] ?? 0) + 1;
          } else if (cell.state === "missed") {
            dayDue[dayIdx] = (dayDue[dayIdx] ?? 0) + 1;
          }
        }
      }
    }

    const overallConsistency =
      totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0;
    const dayOfWeekAdherence = dayDone.map((done, idx) => {
      const due = dayDue[idx] ?? 0;
      return due > 0 ? Math.round((done / due) * 100) : 0;
    });

    return {
      overallConsistency,
      totalDone,
      totalDue,
      bestActiveStreak,
      allTimeBestStreak,
      dayOfWeekAdherence
    };
  }, [insights]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
              <TrendingUp className="h-3 w-3" />
              Consistency & Analytics
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-content">
            Insights
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Track your long-term adherence, weekly patterns, and habit
            consistency.
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div
          role="group"
          aria-label="Time range"
          className="inline-flex self-start rounded-2xl border border-border-app bg-surface-2 p-1.5 shadow-sm sm:self-auto"
        >
          <button
            type="button"
            aria-pressed={days === 7}
            onClick={() => setDays(7)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95",
              days === 7
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "text-content-muted hover:text-content hover:bg-surface-3"
            )}
          >
            Last 7 days
          </button>
          <button
            type="button"
            aria-pressed={days === 30}
            onClick={() => setDays(30)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95",
              days === 30
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "text-content-muted hover:text-content hover:bg-surface-3"
            )}
          >
            Last 30 days
          </button>
        </div>
      </header>

      {/* Loading & Error States */}
      {query.isLoading && (
        <div className="surface-card p-12 text-center text-sm font-medium text-content-muted">
          Analyzing consistency patterns…
        </div>
      )}

      {query.isError && (
        <div className="surface-card border-rose-500/30 p-6 text-center">
          <p className="text-sm font-medium text-rose-500">
            Could not load insights.
          </p>
          <Button
            variant="ghost"
            className="mt-3"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!query.isLoading && insights.length === 0 && !query.isError && (
        <EmptyState
          title="No history yet"
          description="Your first check-in will start building consistency data. Log today's habits to begin."
          actionHref="/habits"
          actionLabel="Go to Habits"
        />
      )}

      {!query.isLoading && insights.length > 0 && (
        <>
          {/* Top KPI Metrics Grid */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Overall Consistency */}
            <div className="surface-card p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-content-muted uppercase tracking-wider">
                <span>Adherence Rate</span>
                <Target className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl sm:text-4xl font-black text-content">
                  {stats.overallConsistency}%
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    stats.overallConsistency >= 80
                      ? "bg-emerald-500/15 text-emerald-400"
                      : stats.overallConsistency >= 50
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-rose-500/15 text-rose-400"
                  )}
                >
                  {stats.overallConsistency >= 80
                    ? "Legendary"
                    : stats.overallConsistency >= 50
                      ? "Building"
                      : "Needs Focus"}
                </span>
              </div>
              <p className="mt-1 text-xs text-content-muted">
                {stats.totalDone} completed of {stats.totalDue} scheduled
                sessions
              </p>
            </div>

            {/* Total Check-ins */}
            <div className="surface-card p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-content-muted uppercase tracking-wider">
                <span>Completed Quests</span>
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-3">
                <span className="font-display text-3xl sm:text-4xl font-black text-content">
                  {stats.totalDone}
                </span>
              </div>
              <p className="mt-1 text-xs text-content-muted">
                Successful completions in the last {days} days
              </p>
            </div>

            {/* Active Streak */}
            <div className="surface-card p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-content-muted uppercase tracking-wider">
                <span>Top Active Streak</span>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-3xl sm:text-4xl font-black text-amber-500">
                  {stats.bestActiveStreak}
                </span>
                <span className="text-sm font-bold text-content-muted">
                  days
                </span>
              </div>
              <p className="mt-1 text-xs text-content-muted">
                All-time best: {stats.allTimeBestStreak} consecutive days
              </p>
            </div>

            {/* Active Habits Tracked */}
            <div className="surface-card p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-content-muted uppercase tracking-wider">
                <span>Active Habits</span>
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <div className="mt-3">
                <span className="font-display text-3xl sm:text-4xl font-black text-content">
                  {insights.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-content-muted">
                Routines tracked in this cycle
              </p>
            </div>
          </section>

          {/* Day of Week Consistency Chart */}
          <section className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-content flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-accent" />
                  Day-of-the-Week Adherence
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  See which days you are most consistent and where momentum
                  drops.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4">
              {DAYS_OF_WEEK.map((dayName, idx) => {
                const rate = stats.dayOfWeekAdherence[idx] ?? 0;
                const isHigh = rate >= 75;
                const isMid = rate >= 40 && rate < 75;

                return (
                  <div
                    key={dayName}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="text-[11px] font-bold text-content-muted">
                      {rate}%
                    </div>
                    {/* Bar Track */}
                    <div className="w-full h-28 bg-surface-2 rounded-xl flex items-end p-1 overflow-hidden">
                      <div
                        className={cn(
                          "w-full rounded-lg transition-all duration-500",
                          rate === 0
                            ? "bg-transparent h-1"
                            : isHigh
                              ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              : isMid
                                ? "bg-gradient-to-t from-amber-600 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                                : "bg-gradient-to-t from-rose-600 to-red-400"
                        )}
                        style={{ height: `${Math.max(6, rate)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-content">
                      {dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Per-Habit Breakdown */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-content">
                Individual Habit Performance
              </h3>
              <span className="text-xs text-content-muted font-medium">
                {insights.length} habits tracked
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {insights.map((row) => {
                const consistencyRate = row.consistency ?? 0;
                const isHigh = consistencyRate >= 80;
                const isMid = consistencyRate >= 50 && consistencyRate < 80;

                // Up to 14 recent cells for the compact dot matrix (7 when
                // the 7-day range is selected).
                const recentCells = row.cells.slice(-14);
                const isWeekly =
                  rulesAt(row.habit, today).schedule === "weekly";

                return (
                  <div
                    key={row.habit.id}
                    className="surface-card flex flex-col justify-between p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:border-accent/40"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/habits/${row.habit.id}`}
                            className="font-display text-lg font-bold text-content hover:text-accent transition truncate block"
                          >
                            {row.habit.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-content-muted capitalize">
                            {row.habit.type === "action"
                              ? "Action habit"
                              : `Measurable (${row.habit.unit ?? "units"})`}
                          </p>
                        </div>

                        {/* Consistency Score Badge */}
                        <div className="text-right shrink-0">
                          <div
                            className={cn(
                              "font-display text-2xl font-black",
                              row.consistency === null
                                ? "text-content-muted"
                                : isHigh
                                  ? "text-emerald-400"
                                  : isMid
                                    ? "text-amber-400"
                                    : "text-rose-400"
                            )}
                          >
                            {row.consistency === null
                              ? "—"
                              : `${row.consistency}%`}
                          </div>
                          <span className="text-[10px] font-semibold text-content-muted">
                            Adherence
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3.5">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isHigh
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : isMid
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                  : "bg-gradient-to-r from-rose-500 to-red-400"
                            )}
                            style={{
                              width: `${Math.min(100, Math.max(4, consistencyRate))}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Stats Strip */}
                      <div className="mt-3.5 flex items-center justify-between text-xs text-content-2">
                        <span>
                          {row.done} of {row.due}{" "}
                          {isWeekly ? "sessions" : "days"} completed
                        </span>
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Flame className="h-3.5 w-3.5" />
                          <span>
                            {row.current}-{isWeekly ? "week" : "day"} streak
                          </span>
                          <span className="text-content-muted text-[10px]">
                            (Best: {row.best} {isWeekly ? "wk" : "d"})
                          </span>
                        </div>
                      </div>

                      {/* Modern Dot Matrix Activity Strip (No ugly scrollbars) */}
                      <div className="mt-4 pt-3 border-t border-border-app">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-content-muted">
                          Last {recentCells.length} days activity
                        </p>
                        <div className="grid grid-cols-7 gap-1.5">
                          {recentCells.map((cell) => {
                            const isDone = cell.state === "completed";
                            const isSkipped = cell.state === "skipped";
                            const isMissed = cell.state === "missed";

                            return (
                              <div
                                key={cell.date}
                                title={`${cell.date}: ${cell.state}${cell.value ? ` (${cell.value})` : ""}`}
                                aria-label={`${cell.date}: ${cell.state}`}
                                role="img"
                                className={cn(
                                  "flex h-7 flex-col items-center justify-center rounded-lg text-[10px] font-black transition cursor-default",
                                  isDone &&
                                    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10",
                                  isSkipped &&
                                    "bg-amber-500/15 text-amber-400 border border-amber-500/30",
                                  isMissed &&
                                    "bg-rose-500/15 text-rose-400 border border-rose-500/30",
                                  !isDone &&
                                    !isSkipped &&
                                    !isMissed &&
                                    "bg-surface-2 text-content-muted/40 border border-border-app/40"
                                )}
                              >
                                {isDone
                                  ? "✓"
                                  : isSkipped
                                    ? "—"
                                    : isMissed
                                      ? "✕"
                                      : "·"}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-border-app flex items-center justify-between text-xs font-semibold">
                      <span className="text-content-muted">
                        {row.due === 0
                          ? "No scheduled days yet"
                          : `${row.done} successes`}
                      </span>
                      <Link
                        to={`/habits/${row.habit.id}`}
                        className="flex items-center gap-1 text-accent hover:underline"
                      >
                        <span>History & Details</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
