import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionCard } from "../components/ui/SectionCard";
import { Confetti } from "../components/viz/Confetti";
import { CountUp } from "../components/viz/CountUp";
import { ProgressRing } from "../components/viz/ProgressRing";
import { StreakFlame } from "../components/viz/StreakFlame";
import { ArchivedHabits } from "../features/habits/components/ArchivedHabits";
import { DailyLogTable } from "../features/habits/components/DailyLogTable";
import { useHabits } from "../features/habits/hooks/useHabits";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import { useSaveHabitLog } from "../features/logs/hooks/useHabitLogs";
import { formatDateLabel, getTodayDateString, isToday } from "../shared/lib/date";
import { accentHex } from "../shared/lib/theme";
import { useThemeStore } from "../stores/themeStore";
import type { ActionStatus, HabitListItem } from "../shared/types/habit";

const motivationFor = (
  tracked: number,
  total: number,
  today: boolean
): { title: string; subtitle: string } => {
  if (total === 0) {
    return {
      title: "Let's build your first habit",
      subtitle: "One habit is all it takes to start a streak worth protecting."
    };
  }

  const remaining = total - tracked;

  if (tracked === 0) {
    return {
      title: today ? "A fresh day to show up" : "Nothing logged this day",
      subtitle: today
        ? "Log your first habit now — momentum starts with a single check-in."
        : "Fill in what happened on this day to keep your history complete."
    };
  }

  if (remaining === 0) {
    return {
      title: today ? "Every habit logged. 🎉" : "This day is fully logged",
      subtitle: today
        ? "You didn't miss a single one today. This is how streaks are made."
        : "Great — no gaps in your history for this day."
    };
  }

  return {
    title: today ? "You're on a roll" : "Almost complete",
    subtitle: `${remaining} habit${remaining === 1 ? "" : "s"} still waiting to be logged ${
      today ? "today" : "this day"
    }.`
  };
};

export const HomePage = () => {
  const selectedDate = useHomeDateStore((state) => state.selectedDate);
  const setSelectedDate = useHomeDateStore((state) => state.setSelectedDate);
  const shiftSelectedDate = useHomeDateStore((state) => state.shiftSelectedDate);
  const resetSelectedDate = useHomeDateStore((state) => state.resetSelectedDate);

  const habitsQuery = useHabits(selectedDate);
  const saveLogMutation = useSaveHabitLog();
  const accent = useThemeStore((s) => s.accent);
  const ringColor = accentHex(accent);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const wasComplete = useRef(false);

  const habits = habitsQuery.data ?? [];
  const habitCount = habits.length;
  const doneCount = habits.filter(
    (habit) => habit.selectedDateLog?.status === "done"
  ).length;
  const loggedCount = habits.filter(
    (habit) => habit.selectedDateLog !== null
  ).length;
  const missedCount = habits.filter(
    (habit) => habit.selectedDateLog?.status === "not_done"
  ).length;
  const bestStreak = habits.reduce(
    (max, habit) =>
      habit.stats.type === "action"
        ? Math.max(max, habit.stats.currentStreak)
        : max,
    0
  );
  const untracked = habits.filter((habit) => habit.selectedDateLog === null);

  const today = isToday(selectedDate);
  const trackedRatio = habitCount === 0 ? 0 : loggedCount / habitCount;
  const trackedPercent = Math.round(trackedRatio * 100);
  const motivation = motivationFor(loggedCount, habitCount, today);

  // Celebrate the first moment the day becomes fully logged (today only).
  useEffect(() => {
    const complete = habitCount > 0 && loggedCount === habitCount && today;
    if (complete && !wasComplete.current) {
      setCelebrate(true);
      const timer = setTimeout(() => setCelebrate(false), 2600);
      wasComplete.current = true;
      return () => clearTimeout(timer);
    }
    if (!complete) {
      wasComplete.current = false;
    }
  }, [habitCount, loggedCount, today]);

  const handleSaveAction = async (
    habitId: string,
    logId: string | undefined,
    status: ActionStatus,
    comment?: string
  ) => {
    try {
      setActiveHabitId(habitId);
      await saveLogMutation.mutateAsync({
        habitId,
        logId,
        input: { date: selectedDate, status, comment }
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
        input: { date: selectedDate, value }
      });
    } finally {
      setActiveHabitId(null);
    }
  };

  return (
    <div className="space-y-6">
      {celebrate ? <Confetti /> : null}

      {/* Hero */}
      <section className="surface-card animate-fade-in-up relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-accent/10 via-accent/10 to-transparent" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Daily log
              </p>
              <span className="rounded-full bg-surface-3 px-3 py-1 text-xs font-semibold text-content-2">
                {formatDateLabel(selectedDate)}
              </span>
              {today ? (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/30">
                  Today
                </span>
              ) : null}
            </div>

            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
              {motivation.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-content-2 sm:text-base">
              {motivation.subtitle}
            </p>

            {/* stat chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              <div className="rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-border-app">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content-muted">
                  Done
                </p>
                <p className="mt-0.5 text-xl font-bold text-emerald-600">
                  <CountUp value={doneCount} />
                </p>
              </div>
              <div className="rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-border-app">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content-muted">
                  Missed
                </p>
                <p className="mt-0.5 text-xl font-bold text-rose-500">
                  <CountUp value={missedCount} />
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-4 py-3 ring-1 ring-border-app">
                <StreakFlame count={bestStreak} size={26} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content-muted">
                    Best streak
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-content">
                    <CountUp value={bestStreak} />
                    <span className="ml-1 text-sm font-semibold text-content-subtle">
                      day{bestStreak === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* date nav */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-2xl border border-border-app bg-surface-2/80 p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => shiftSelectedDate(-1)}
                >
                  ← Prev
                </Button>
                <input
                  type="date"
                  value={selectedDate}
                  max={getTodayDateString()}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-9 rounded-xl border border-border-app bg-surface px-3 text-sm font-medium text-content shadow-sm focus:border-accent/60 focus:ring-4 focus:ring-accent/30"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => shiftSelectedDate(1)}
                  disabled={today}
                  title={today ? "You can't log the future" : undefined}
                >
                  Next →
                </Button>
              </div>
              {!today ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={resetSelectedDate}
                >
                  Jump to today
                </Button>
              ) : null}
              <Button
                type="button"
                variant={showArchived ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"></polyline>
                  <rect x="1" y="3" width="22" height="5"></rect>
                  <line x1="10" y1="12" x2="14" y2="12"></line>
                </svg>
                {showArchived ? "Hide Archived" : "Show Archived"}
              </Button>
              <Button asChild size="sm">
                <Link to="/habits/new">+ New habit</Link>
              </Button>
            </div>
          </div>

          {/* progress ring */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <ProgressRing
              value={trackedRatio}
              size={168}
              stroke={14}
              color={ringColor}
              trackColor="rgba(120,130,150,0.18)"
            >
              <span className="text-4xl font-bold text-content">
                <CountUp value={trackedPercent} suffix="%" />
              </span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-content-subtle">
                Tracked
              </span>
            </ProgressRing>
            <p className="text-sm font-semibold text-content-2">
              {loggedCount} of {habitCount} logged
            </p>
          </div>
        </div>

        {/* untracked nudge */}
        {today && untracked.length > 0 && habitCount > 0 ? (
          <div className="relative mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <span className="flex h-2.5 w-2.5 shrink-0 animate-glow rounded-full bg-amber-500" />
            <p className="text-sm font-semibold text-amber-600">
              Don&apos;t miss today:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {untracked.map((habit) => (
                <span
                  key={habit.id}
                  className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/30"
                >
                  {habit.title}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {saveLogMutation.error ? (
        <SectionCard className="border border-rose-500/30 bg-rose-500/10">
          <p className="text-sm font-medium text-rose-600">
            {saveLogMutation.error.message}
          </p>
        </SectionCard>
      ) : null}

      {habitsQuery.isLoading ? (
        <SectionCard
          title={`Habits for ${formatDateLabel(selectedDate)}`}
          description="Loading your daily log..."
        >
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="shimmer h-20 rounded-2xl bg-surface-3"
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {habitsQuery.isError ? (
        <SectionCard title="Unable to load habits">
          <p className="text-sm text-rose-600">{habitsQuery.error.message}</p>
        </SectionCard>
      ) : null}

      {!habitsQuery.isLoading && !habitsQuery.isError && habitCount === 0 ? (
        <EmptyState
          title="No habits created yet"
          description="Create your first habit to start logging action-based check-ins or measurable daily values."
          actionHref="/habits/new"
          actionLabel="Create your first habit"
        />
      ) : null}

      {!habitsQuery.isLoading && !habitsQuery.isError && habitCount > 0 ? (
        <SectionCard
          title={`Habits for ${formatDateLabel(selectedDate)}`}
          description={
            today
              ? "Action habits save immediately. Measurable habits save when you press Save."
              : "Missed a day? Fill the rows below and the selected date updates right away."
          }
        >
          <DailyLogTable
            habits={habits as HabitListItem[]}
            selectedDate={selectedDate}
            savingHabitId={saveLogMutation.isPending ? activeHabitId : null}
            onSaveAction={handleSaveAction}
            onSaveValue={handleSaveValue}
          />
        </SectionCard>
      ) : null}

      {showArchived ? (
        <div className="animate-pop-in">
          <ArchivedHabits />
        </div>
      ) : null}
    </div>
  );
};
