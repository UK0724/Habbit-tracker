import { templates } from "../features/habits/templates";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Plus, Check, FileText } from "lucide-react";
import { useHabits } from "../features/habits/hooks/useHabits";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import { useSaveHabitLog } from "../features/logs/hooks/useHabitLogs";
import { useGameProfile } from "../features/gamification/hooks/useGameProfile";
import { useDailyCheckin } from "../features/gamification/hooks/useDailyCheckin";
import { Button } from "../components/ui/Button";
import { XPToast } from "../components/ui/XPToast";
import { triggerXPToast } from "../stores/xpToastStore";
import { CelebrationOverlay } from "../components/CelebrationOverlay";
import { StreakLostScreen } from "../components/StreakLostScreen";
import { DailyCheckInBanner } from "../components/DailyCheckInBanner";
import { MockAdModal } from "../features/ads/components/MockAdModal";
import { playSound } from "../shared/lib/sounds";
import { getTodayDateString, formatDateLabel } from "../shared/lib/date";
import { completed, dayState, rulesAt } from "../shared/lib/rules";
import type { HabitListItem, SaveHabitLogInput } from "../shared/types/habit";
import { cn } from "../shared/lib/utils";
import { useCreateHabitModalStore } from "../features/habits/stores/createHabitModalStore";

const BORDER_COLOR_MAP: Record<string, string> = {
  violet: "border-l-violet-500",
  indigo: "border-l-indigo-500",
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  rose: "border-l-rose-500",
  amber: "border-l-amber-500",
  slate: "border-l-slate-500"
};

const DailyCard = ({
  habit,
  date,
  onSave,
  busy,
  saving
}: {
  habit: HabitListItem;
  date: string;
  onSave: (h: HabitListItem, input: SaveHabitLogInput) => Promise<void>;
  busy: boolean;
  saving: boolean;
}) => {
  const [value, setValue] = useState(
    habit.selectedDateLog?.value?.toString() ?? ""
  );
  const [note, setNote] = useState(habit.selectedDateLog?.comment ?? "");
  const [error, setError] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const state = dayState(habit, habit.recentDays, date, getTodayDateString());
  const rule = rulesAt(habit, date);

  const isComplete = state === "completed";
  const xpReward = habit.type === "action" ? 10 : 15;
  const borderClass = BORDER_COLOR_MAP[habit.color] ?? "border-l-accent";

  const save = async (input: SaveHabitLogInput) => {
    setError("");
    const wasCompleted = isComplete;
    try {
      await onSave(habit, { ...input, comment: note });
      // Trigger sound and XP toast when newly completed or reverted
      const willBeCompleted =
        input.status === "done" ||
        (input.value !== undefined &&
          completed(habit, { date, status: null, value: input.value }));

      if (!wasCompleted && willBeCompleted) {
        playSound("complete");
        triggerXPToast(xpReward, "XP", undefined, undefined, "Completed!");
      } else if (wasCompleted && !willBeCompleted) {
        triggerXPToast(-xpReward, "XP", undefined, undefined, "Undone");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    }
  };

  const toggleTick = () => {
    if (isComplete) {
      void save({ date, status: "not_done" });
    } else if (habit.type === "action") {
      void save({ date, status: "done" });
    } else {
      const targetVal = rule.target ?? 1;
      setValue(String(targetVal));
      void save({ date, value: targetVal });
    }
  };

  return (
    <article
      className={cn(
        "group relative overflow-hidden border-b border-border-app/60 border-l-2 p-4 sm:p-5 transition-colors",
        borderClass,
        isComplete
          ? "bg-emerald-500/5 border-l-emerald-500"
          : "hover:bg-surface/50"
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Satisfying 1-Tap Circular Tick Button */}
        <button
          type="button"
          aria-label={isComplete ? "Mark habit incomplete" : "Mark habit done"}
          disabled={busy}
          onClick={toggleTick}
          className={cn(
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-90",
            isComplete
              ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400/50"
              : state === "skipped"
                ? "border-2 border-dashed border-amber-500/40 bg-amber-500/10 text-amber-500 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                : "border-2 border-border-app bg-surface-2 text-transparent hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500/60"
          )}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-emerald-500" />
          ) : (
            <Check
              className={cn(
                "h-6 w-6 stroke-[3.2] transition-transform",
                isComplete
                  ? "scale-100 text-white"
                  : "scale-75 opacity-0 group-hover:opacity-40"
              )}
            />
          )}
        </button>

        {/* Center: Title + Quest XP Badge + Schedule */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  className={cn(
                    "font-display text-base font-bold transition hover:text-accent",
                    isComplete
                      ? "text-content line-through opacity-85"
                      : "text-content"
                  )}
                  to={`/habits/${habit.id}`}
                >
                  {habit.title}
                </Link>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-extrabold text-amber-400">
                  <Sparkles className="h-3 w-3" />+{xpReward} XP
                </span>
              </div>

              <p className="mt-1 text-xs text-content-muted">
                {rule.schedule === "weekly"
                  ? `${rule.timesPerWeek} days per week`
                  : rule.schedule === "weekdays"
                    ? "Selected weekdays"
                    : "Every day"}
                {habit.unit ? ` · ${habit.unit}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {state === "skipped" && (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Skipped
                </span>
              )}

              {/* Fast Skip / Note controls */}
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void save({
                    date,
                    status: state === "skipped" ? "not_done" : "skipped"
                  })
                }
                title={
                  state === "skipped"
                    ? "Unskip this habit"
                    : "Skip today without breaking streak"
                }
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[11px] font-bold transition",
                  state === "skipped"
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "text-content-muted hover:text-content hover:bg-surface-2"
                )}
              >
                {state === "skipped" ? "Unskip" : "Skip"}
              </button>
              <button
                type="button"
                onClick={() => setNotesOpen(!notesOpen)}
                title="Add note"
                className="rounded-lg p-1 text-content-muted hover:text-content hover:bg-surface-2 transition"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {habit.type !== "action" && (
            <p className="mt-2 text-xs text-content-2">
              {rule.goalDirection === "record" || rule.target == null
                ? "Record any value"
                : rule.goalDirection === "range"
                  ? `Daily range: ${rule.target}–${rule.targetMax}`
                  : `Daily target: ${rule.goalDirection === "down" ? "at most" : "at least"} ${rule.target}`}{" "}
              {habit.unit}
            </p>
          )}

          {/* Measurable Steppers or Classic Form */}
          {habit.type !== "action" ? (
            <form
              className="mt-3 flex flex-wrap gap-2 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                if (value.trim() && Number.isFinite(Number(value))) {
                  void save({ date, value: Number(value) });
                } else {
                  setError("Enter a valid number.");
                }
              }}
            >
              <label className="sr-only" htmlFor={`value-${habit.id}`}>
                {habit.title} value in {habit.unit}
              </label>
              <input
                id={`value-${habit.id}`}
                className="field-input min-w-0 w-24 sm:w-28 flex-none"
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Value"
              />
              <Button
                type="submit"
                size="sm"
                disabled={busy}
                className="font-bold"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <button
                type="button"
                className="rounded-xl border border-border-app px-2.5 py-1.5 text-xs font-bold text-content-2 hover:bg-surface-2 transition active:scale-95"
                onClick={() => {
                  const nextVal = String(Number(value || 0) + 1);
                  setValue(nextVal);
                  void save({ date, value: Number(nextVal) });
                }}
              >
                +1
              </button>
              {rule.target != null && rule.target >= 10 && (
                <button
                  type="button"
                  className="rounded-xl border border-border-app px-2.5 py-1.5 text-xs font-bold text-content-2 hover:bg-surface-2 transition active:scale-95"
                  onClick={() => {
                    const nextVal = String(Number(value || 0) + 5);
                    setValue(nextVal);
                    void save({ date, value: Number(nextVal) });
                  }}
                >
                  +5
                </button>
              )}
              {rule.target != null && (
                <button
                  type="button"
                  className="rounded-xl border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition active:scale-95"
                  onClick={() => {
                    setValue(String(rule.target));
                    void save({ date, value: rule.target });
                  }}
                >
                  Goal ({rule.target})
                </button>
              )}
            </form>
          ) : null}

          {(notesOpen || habit.requireCompletionComment) && (
            <label className="mt-3 block w-full text-xs text-content-2">
              {habit.requireCompletionComment
                ? "Completion note (required)"
                : "Optional note"}
              <div className="mt-1 flex gap-2">
                <textarea
                  maxLength={280}
                  className="field-input flex-1"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add details about your session..."
                />
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    void save({
                      date,
                      status:
                        habit.type === "action"
                          ? isComplete
                            ? "done"
                            : null
                          : null,
                      value: value ? Number(value) : undefined
                    })
                  }
                >
                  Save Note
                </Button>
              </div>
            </label>
          )}

          {error && (
            <p
              role="alert"
              className="mt-2 text-xs text-rose-500 font-semibold"
            >
              {error}
            </p>
          )}

          {habit.linkToExpenseTracker && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-accent">
              <Link
                to="/expenses"
                className="hover:underline flex items-center gap-1 font-semibold"
              >
                Open expenses ↗
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export const TodayPage = ({
  hideHeader = false
}: {
  hideHero?: boolean;
  hideHeader?: boolean;
} = {}) => {
  const {
    selectedDate,
    setSelectedDate,
    shiftSelectedDate,
    resetSelectedDate
  } = useHomeDateStore();
  const query = useHabits(selectedDate);
  const mutation = useSaveHabitLog();
  const cache = useQueryClient();

  const { data: profile } = useGameProfile();
  const {
    result: checkinResult,
    showStreakLost,
    setShowStreakLost,
    showDailyBanner,
    setShowDailyBanner
  } = useDailyCheckin();

  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const habits = query.data ?? [];
  const dueHabits = habits.filter((habit) => {
    const state = dayState(
      habit,
      habit.recentDays,
      selectedDate,
      getTodayDateString()
    );
    return state !== "rest" && state !== "skipped";
  });
  const openCreateHabit = useCreateHabitModalStore((s) => s.open);
  const done = dueHabits.filter((h) =>
    completed(h, h.selectedDateLog ?? undefined)
  ).length;
  const allCompleted = dueHabits.length > 0 && done === dueHabits.length;

  // Trigger legendary day celebration when all habits completed — only once per day
  useEffect(() => {
    if (!allCompleted) return;
    const storageKey = `celebrated_flawless_${selectedDate}`;
    const alreadyCelebrated = localStorage.getItem(storageKey);
    if (!alreadyCelebrated) {
      localStorage.setItem(storageKey, "true");
      setCelebrating(true);
    }
  }, [allCompleted, selectedDate]);

  const save = async (h: HabitListItem, input: SaveHabitLogInput) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await mutation.mutateAsync({
        habitId: h.id,
        logId: h.selectedDateLog?.id,
        input
      });
      void cache.invalidateQueries({ queryKey: ["gamification", "profile"] });
      void cache.invalidateQueries({
        queryKey: ["gamification", "achievements"]
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  if (query.isLoading) return <p role="status">Loading your habits…</p>;
  if (query.isError)
    return (
      <div role="alert">
        Could not load habits.{" "}
        <Button onClick={() => void query.refetch()}>Retry</Button>
      </div>
    );

  const currentStreak = profile?.loginStreak ?? 1;

  return (
    <div className="space-y-6">
      {/* XP Toast & Modals */}
      <XPToast />
      <MockAdModal />

      {/* Daily Check-in Top Banner */}
      {showDailyBanner && (
        <DailyCheckInBanner
          streak={currentStreak}
          xpAwarded={checkinResult?.xpAwarded}
          onDismiss={() => setShowDailyBanner(false)}
        />
      )}

      {/* Streak Lost Overlay */}
      <StreakLostScreen
        isOpen={showStreakLost}
        onClose={() => setShowStreakLost(false)}
        lostStreak={checkinResult?.streak}
      />

      {/* Legendary Day Celebration Overlay */}
      <CelebrationOverlay
        isOpen={celebrating}
        onClose={() => setCelebrating(false)}
        streak={currentStreak}
        habitsCount={dueHabits.length}
      />

      {/* Page Header */}
      {!hideHeader && (
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Make room for progress
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold">
              {habits.length ? "Today's Quests" : "Welcome to Pulse"}
            </h1>
            <p className="mt-1 text-sm text-content-muted">
              {habits.length
                ? "Complete daily habits to gain XP, level up, and maintain your streak."
                : "Bring your daily routines, healthy habits, and goals into one place."}
            </p>
          </div>
          {habits.length > 0 && (
            <Button
              onClick={() => openCreateHabit()}
              className="cursor-pointer font-bold shadow-md shadow-accent/20"
            >
              <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> New habit
            </Button>
          )}
        </header>
      )}

      {!habits.length ? (
        <section className="surface-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Start with one small habit</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-content-2">
            Choose something you want to make time for. You can adjust it as you
            go.
          </p>
          <Button
            onClick={() => openCreateHabit()}
            className="mt-5 cursor-pointer font-bold shadow-md shadow-accent/20"
          >
            <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Create your first
            habit
          </Button>
          <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-content-muted">
            Or use a starter template
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => openCreateHabit(t)}
                className="flex items-center justify-between rounded-xl border border-border-app p-4 text-sm font-semibold hover:border-accent hover:bg-surface-2 transition text-left cursor-pointer group"
              >
                <span>{t.title}</span>
                <span className="text-accent font-bold transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Progress Tracker & Date Navigation */}
          <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div>
                {dueHabits.length ? (
                  <>
                    <strong>{done} completed</strong>
                    <span className="ml-2 text-sm text-content-muted">
                      of {dueHabits.length} due quest
                      {dueHabits.length === 1 ? "" : "s"}
                    </span>
                  </>
                ) : (
                  <strong>No quests due today</strong>
                )}
              </div>
              {allCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-400">
                  <Check className="h-3 w-3 stroke-[3]" /> All Done!
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                aria-label="Previous date"
                disabled={busy}
                onClick={() => shiftSelectedDate(-1)}
              >
                ‹
              </Button>
              <label className="sr-only" htmlFor="log-date">
                Log date
              </label>
              <input
                id="log-date"
                type="date"
                max={getTodayDateString()}
                value={selectedDate}
                disabled={busy}
                onChange={(e) =>
                  e.target.value && setSelectedDate(e.target.value)
                }
                className="rounded-xl border border-border-app bg-surface p-2 text-sm"
              />
              <Button
                variant="ghost"
                aria-label="Next date"
                disabled={busy || selectedDate >= getTodayDateString()}
                onClick={() => shiftSelectedDate(1)}
              >
                ›
              </Button>
              <Button
                variant="ghost"
                disabled={busy}
                onClick={resetSelectedDate}
              >
                Today
              </Button>
            </div>
          </section>

          <p className="text-sm text-content-muted">
            {formatDateLabel(selectedDate)} · Tap any habit to complete and earn
            XP.
          </p>

          {/* Quests Grid */}
          <div className="grid gap-4 xl:grid-cols-2">
            {habits.map((h) => (
              <DailyCard
                key={`${h.id}-${selectedDate}-${h.selectedDateLog?.updatedAt ?? "new"}`}
                habit={h}
                date={selectedDate}
                onSave={save}
                busy={busy}
                saving={
                  mutation.isPending && mutation.variables?.habitId === h.id
                }
              />
            ))}
          </div>
        </>
      )}

      {/* End Today content */}
    </div>
  );
};
