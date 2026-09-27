import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  ArrowRight,
  Sparkles,
  Sliders,
  Zap,
  LayoutList,
  Archive
} from "lucide-react";
import { useHabits } from "../features/habits/hooks/useHabits";
import { ArchivedHabits } from "../features/habits/components/ArchivedHabits";
import { TodayPage } from "./TodayPage";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { StreakFlame } from "../components/viz/StreakFlame";
import { getTodayDateString } from "../shared/lib/date";
import { rulesAt } from "../shared/lib/rules";
import { cn } from "../shared/lib/utils";
import { useCreateHabitModalStore } from "../features/habits/stores/createHabitModalStore";

const BORDER_COLOR_MAP: Record<string, string> = {
  violet: "border-l-violet-500 hover:border-l-violet-400",
  indigo: "border-l-indigo-500 hover:border-l-indigo-400",
  blue: "border-l-blue-500 hover:border-l-blue-400",
  emerald: "border-l-emerald-500 hover:border-l-emerald-400",
  rose: "border-l-rose-500 hover:border-l-rose-400",
  amber: "border-l-amber-500 hover:border-l-amber-400",
  slate: "border-l-slate-500 hover:border-l-slate-400"
};

export const HabitsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawView = searchParams.get("view");
  const view = rawView === "all" || rawView === "archived" ? rawView : "today";

  const query = useHabits(getTodayDateString());
  const habits = query.data ?? [];

  const openCreateHabit = useCreateHabitModalStore((s) => s.open);

  const actionCount = habits.filter((h) => h.type === "action").length;
  const measurableCount = habits.filter((h) => h.type === "measurable").length;

  const setView = (nextView: "today" | "all" | "archived") => {
    if (nextView === "today") {
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      setSearchParams(next);
    } else {
      setSearchParams({ view: nextView });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
              <Sparkles className="h-3 w-3" />
              Habits Hub
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-content">
            {view === "today"
              ? "Today's Quests"
              : view === "all"
                ? "All Habits"
                : "Archived Habits"}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-content-muted">
            {view === "today"
              ? "Complete daily habits to earn XP, level up, and maintain streaks."
              : view === "all"
                ? "Your complete catalog of routines and frequency schedules."
                : "Inactive habits preserved with historical tracking data intact."}
          </p>
        </div>

        <Button
          onClick={() => openCreateHabit()}
          className="self-start sm:self-auto font-bold shadow-md shadow-accent/20 cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" />
          New habit
        </Button>
      </header>

      {/* Segmented Filter Tabs - Touch Friendly on Mobile */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-border-app bg-surface-2 p-1.5 w-full sm:w-fit overflow-x-auto no-scrollbar shadow-sm">
        <button
          type="button"
          onClick={() => setView("today")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95",
            view === "today"
              ? "bg-accent text-white shadow-md shadow-accent/25"
              : "text-content-muted hover:text-content hover:bg-surface-3"
          )}
        >
          <Zap className="h-4 w-4" />
          <span>Today</span>
        </button>

        <button
          type="button"
          onClick={() => setView("all")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95",
            view === "all"
              ? "bg-accent text-white shadow-md shadow-accent/25"
              : "text-content-muted hover:text-content hover:bg-surface-3"
          )}
        >
          <LayoutList className="h-4 w-4" />
          <span>All Habits</span>
          {habits.length > 0 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-black",
                view === "all"
                  ? "bg-white/20 text-white"
                  : "bg-surface-3 text-content-2"
              )}
            >
              {habits.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setView("archived")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95",
            view === "archived"
              ? "bg-accent text-white shadow-md shadow-accent/25"
              : "text-content-muted hover:text-content hover:bg-surface-3"
          )}
        >
          <Archive className="h-4 w-4" />
          <span>Archived</span>
        </button>
      </div>

      {/* View Content */}
      {view === "today" && (
        <div className="pt-1">
          <TodayPage hideHeader />
        </div>
      )}

      {view === "all" && (
        <div className="space-y-6">
          {/* Quick Overview Strip */}
          {habits.length > 0 && (
            <div className="grid grid-cols-2 gap-3 border-y border-border-app/60 py-2 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold">
                  {habits.length}
                </div>
                <div>
                  <p className="text-xs font-medium text-content-muted">
                    Active Habits
                  </p>
                  <p className="font-display text-sm font-bold text-content">
                    Tracking Daily
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 font-bold">
                  {actionCount}
                </div>
                <div>
                  <p className="text-xs font-medium text-content-muted">
                    Check-ins
                  </p>
                  <p className="font-display text-sm font-bold text-content">
                    Action Habits
                  </p>
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-3 p-3 sm:col-span-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500 font-bold">
                  {measurableCount}
                </div>
                <div>
                  <p className="text-xs font-medium text-content-muted">
                    Measurable
                  </p>
                  <p className="font-display text-sm font-bold text-content">
                    Quantified Goals
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading & Error States */}
          {query.isLoading && (
            <div className="surface-card p-12 text-center text-sm font-medium text-content-muted">
              Loading your habits…
            </div>
          )}

          {query.isError && (
            <div className="surface-card border-rose-500/30 p-6 text-center">
              <p className="text-sm font-medium text-rose-500">
                Could not load habits.
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

          {/* Active Habits Grid */}
          {!query.isLoading && habits.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {habits.map((habit) => {
                const borderClass =
                  BORDER_COLOR_MAP[habit.color] ??
                  "border-l-accent hover:border-l-accent";
                const rule = rulesAt(habit, getTodayDateString());
                const streakCount =
                  habit.stats.type === "action" ? habit.stats.currentStreak : 0;

                return (
                  <Link
                    key={habit.id}
                    to={`/habits/${habit.id}`}
                    className={cn(
                      "surface-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border-l-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg",
                      borderClass
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-display text-lg font-bold text-content transition group-hover:text-accent">
                              {habit.title}
                            </h2>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-content-muted">
                            {habit.description || "Daily personal routine"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <StreakFlame count={streakCount} size={22} />
                          <span className="text-xs font-black text-amber-500">
                            {streakCount}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-content-2 border border-border-app">
                          {habit.type === "action"
                            ? "Action"
                            : habit.type === "expense"
                              ? "Expense"
                              : `Measurable (${habit.unit ?? "units"})`}
                        </span>

                        <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-content-muted border border-border-app">
                          {rule?.schedule === "weekly"
                            ? `${rule.timesPerWeek} days / wk`
                            : rule?.schedule === "weekdays"
                              ? "Specific days"
                              : "Every day"}
                        </span>

                        {habit.type !== "action" && rule?.target != null && (
                          <span className="rounded-full bg-accent/10 px-2.5 py-1 font-bold text-accent">
                            Target: {rule.target} {habit.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border-app pt-3 text-xs font-semibold text-accent">
                      <span className="flex items-center gap-1">
                        <Sliders className="h-3.5 w-3.5" /> Configure & History
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!query.isLoading && habits.length === 0 && !query.isError && (
            <EmptyState
              title="No active habits yet"
              description="Create your first habit to start building positive daily routines and earning XP."
              action={
                <Button
                  onClick={() => openCreateHabit()}
                  className="font-bold shadow-md shadow-accent/20 cursor-pointer"
                >
                  <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" />
                  Create a Habit
                </Button>
              }
            />
          )}
        </div>
      )}

      {view === "archived" && (
        <section className="pt-2">
          <ArchivedHabits />
        </section>
      )}
    </div>
  );
};
