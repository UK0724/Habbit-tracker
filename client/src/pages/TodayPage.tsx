import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Plus, Check, FileText, Moon } from "lucide-react";
import { useHabits } from "../features/habits/hooks/useHabits";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import {
  useDeleteHabitLog,
  useSaveHabitLog
} from "../features/logs/hooks/useHabitLogs";
import { Button } from "../components/ui/Button";
import { playSound } from "../shared/lib/sounds";
import { getTodayDateString, formatDateLabel } from "../shared/lib/date";
import { completed, dayState, rulesAt } from "../shared/lib/rules";
import type {
  HabitListItem,
  HabitLog,
  SaveHabitLogInput
} from "../shared/types/habit";
import { cn } from "../shared/lib/utils";
import { useCreateHabitModalStore } from "../features/habits/stores/createHabitModalStore";
import { StreakRepairBanner } from "../features/habits/components/StreakRepairBanner";
import { FirstHabitEmptyState } from "../features/onboarding/FirstHabitEmptyState";

/** Server rule: only today can be skipped (mirrors the API's message). */
const PAST_SKIP_MESSAGE =
  "Only today can be skipped. Use a streak repair to excuse a missed day.";

const BORDER_COLOR_MAP: Record<string, string> = {
  violet: "border-l-violet-500",
  indigo: "border-l-indigo-500",
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  rose: "border-l-rose-500",
  amber: "border-l-amber-500",
  slate: "border-l-slate-500"
};

type Feedback = { title?: string; undoTitle?: string };

/** Resolves to the saved log, or `null` when another save held the lock. */
type SaveFn = (
  habit: HabitListItem,
  input: SaveHabitLogInput,
  feedback?: Feedback
) => Promise<{ log: HabitLog } | null>;

/** Resolves `{}` once the log is deleted, or `null` when locked out. */
type UndoFn = (
  habit: HabitListItem,
  feedback?: Feedback
) => Promise<Record<string, never> | null>;

const stepButtonClass =
  "min-h-10 rounded-xl border border-border-app px-3 py-1.5 text-xs font-bold text-content-2 hover:bg-surface-2 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const DailyCard = ({
  habit,
  date,
  onSave,
  onUndo,
  busy,
  saving,
  resting = false
}: {
  habit: HabitListItem;
  date: string;
  onSave: SaveFn;
  onUndo: UndoFn;
  busy: boolean;
  saving: boolean;
  resting?: boolean;
}) => {
  const log = habit.selectedDateLog;
  const [value, setValue] = useState(log?.value?.toString() ?? "");
  const [note, setNote] = useState(log?.comment ?? "");
  const [error, setError] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const today = getTodayDateString();
  const state = dayState(habit, habit.recentDays, date, today);
  const isPast = date < today;
  const rule = rulesAt(habit, date);
  const notesId = `notes-${habit.id}`;

  // Keep local inputs in step with the server copy (e.g. after an undo).
  useEffect(() => {
    setValue(log?.value?.toString() ?? "");
    setNote(log?.comment ?? "");
  }, [log?.id, log?.updatedAt, log?.value, log?.comment]);

  const isComplete = state === "completed";
  const isSkipped = state === "skipped";
  // A missed day excused by a streak repair: shown as frozen, not skipped.
  const isFrozen =
    isSkipped &&
    (log?.frozen === true ||
      habit.recentDays.some((d) => d.date === date && d.frozen === true));
  const isAction = habit.type === "action";
  const xpBadge = isAction ? "+10 XP" : "5–15 XP";
  const borderClass = BORDER_COLOR_MAP[habit.color] ?? "border-l-accent";
  const noteRequired = isAction && habit.requireCompletionComment;
  const showNotes = notesOpen || noteRequired;

  const withComment = (input: SaveHabitLogInput): SaveHabitLogInput => {
    const comment = note.trim();
    // Send a note when there is one, or to clear a previously saved note.
    return comment || log?.comment ? { ...input, comment } : input;
  };

  const run = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Try again.");
    }
  };

  const saveEntry = (input: SaveHabitLogInput) =>
    run(async () => {
      const wasComplete = isComplete;
      const payload = withComment(input);
      const willComplete = completed(habit, {
        date,
        status: payload.status ?? null,
        value: payload.value ?? null
      });
      const result = await onSave(habit, payload, {
        title: willComplete ? "Completed!" : "Logged"
      });
      if (!result) return; // another save was running; nothing changed
      if (
        !wasComplete &&
        completed(habit, {
          date,
          status: result.log?.status ?? payload.status ?? null,
          value: result.log?.value ?? payload.value ?? null
        })
      ) {
        playSound("complete");
      }
    });

  const undo = () =>
    run(async () => {
      if (!log) return;
      await onUndo(habit, { undoTitle: isSkipped ? "Unskipped" : "Undone" });
    });

  const toggleTick = () => {
    if (isComplete) {
      void undo();
      return;
    }
    if (isAction) {
      if (noteRequired && !note.trim()) {
        setNotesOpen(true);
        setError("Add a note to complete this habit.");
        return;
      }
      void saveEntry({ date, status: "done" });
      return;
    }
    const targetVal = rule.target ?? 1;
    setValue(String(targetVal));
    void saveEntry({ date, value: targetVal });
  };

  const toggleSkip = () => {
    if (isSkipped) {
      void undo();
      return;
    }
    if (isPast) {
      setError(PAST_SKIP_MESSAGE);
      return;
    }
    void run(async () => {
      const result = await onSave(
        habit,
        { date, status: "skipped" },
        { title: "Skipped" }
      );
      if (result) playSound("skip");
    });
  };

  const saveNote = () =>
    run(async () => {
      if (!log) return;
      await onSave(habit, { date, comment: note.trim() });
    });

  const stepBy = (amount: number) => {
    const nextVal = Number(value || 0) + amount;
    setValue(String(nextVal));
    void saveEntry({ date, value: nextVal });
  };

  return (
    <article
      aria-busy={saving}
      className={cn(
        "group relative overflow-hidden border-b border-border-app/60 border-l-2 p-4 sm:p-5 transition-colors",
        borderClass,
        isComplete
          ? "bg-emerald-500/5 border-l-emerald-500"
          : "hover:bg-surface/50",
        resting && !isComplete && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          aria-label={
            isComplete
              ? `Mark habit incomplete: ${habit.title}`
              : `Mark habit done: ${habit.title}`
          }
          aria-pressed={isComplete}
          disabled={busy}
          onClick={toggleTick}
          className={cn(
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 active:scale-90 disabled:cursor-not-allowed",
            isComplete
              ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400/50"
              : isFrozen
                ? "border-2 border-dashed border-cyan-500/50 bg-cyan-500/10 text-cyan-500 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                : isSkipped
                ? "border-2 border-dashed border-amber-500/40 bg-amber-500/10 text-amber-500 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                : "border-2 border-border-app bg-surface-2 text-transparent hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500/60"
          )}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-emerald-500" />
          ) : (
            <Check
              aria-hidden
              className={cn(
                "h-6 w-6 stroke-[3.2] transition-transform",
                isComplete
                  ? "scale-100 text-white"
                  : "scale-75 opacity-0 group-hover:opacity-40"
              )}
            />
          )}
        </button>

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
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {xpBadge}
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
              {isFrozen ? (
                <span
                  title="Excused by a streak repair"
                  className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300"
                >
                  Frozen ❄️
                </span>
              ) : (
                isSkipped && (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    Skipped
                  </span>
                )
              )}

              {!isComplete && !isFrozen && (
                <button
                  type="button"
                  disabled={busy}
                  aria-disabled={!isSkipped && isPast ? true : undefined}
                  onClick={toggleSkip}
                  aria-label={
                    isSkipped
                      ? `Unskip ${habit.title}`
                      : isPast
                        ? `Skip ${habit.title} (only today can be skipped)`
                        : `Skip ${habit.title} without breaking your streak`
                  }
                  title={
                    isSkipped
                      ? isPast
                        ? "Unskip this habit (past days can't be skipped again)"
                        : "Unskip this habit"
                      : isPast
                        ? PAST_SKIP_MESSAGE
                        : "Skip without breaking your streak"
                  }
                  className={cn(
                    "min-h-10 rounded-lg px-2.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                    isSkipped
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      : isPast
                        ? "cursor-not-allowed text-content-muted opacity-50"
                        : "text-content-muted hover:text-content hover:bg-surface-2"
                  )}
                >
                  {isSkipped ? "Unskip" : "Skip"}
                </button>
              )}
              {!noteRequired && (
                <button
                  type="button"
                  onClick={() => setNotesOpen((open) => !open)}
                  aria-label={`${notesOpen ? "Hide" : "Show"} note for ${habit.title}`}
                  aria-expanded={notesOpen}
                  aria-controls={notesId}
                  title="Note"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted hover:text-content hover:bg-surface-2 transition"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {!isAction && (
            <p className="mt-2 text-xs text-content-2">
              {rule.goalDirection === "record" || rule.target == null
                ? "Record any value"
                : rule.goalDirection === "range"
                  ? `Daily range: ${rule.target}–${rule.targetMax}`
                  : `Daily target: ${rule.goalDirection === "down" ? "at most" : "at least"} ${rule.target}`}{" "}
              {habit.unit}
            </p>
          )}

          {!isAction ? (
            <form
              className="mt-3 flex flex-wrap gap-2 items-center"
              onSubmit={(e) => {
                e.preventDefault();
                if (value.trim() && Number.isFinite(Number(value))) {
                  void saveEntry({ date, value: Number(value) });
                } else {
                  setError("Enter a valid number.");
                }
              }}
            >
              <label className="sr-only" htmlFor={`value-${habit.id}`}>
                {habit.title} value{habit.unit ? ` in ${habit.unit}` : ""}
              </label>
              <input
                id={`value-${habit.id}`}
                className="field-input min-w-0 w-24 sm:w-28 flex-none"
                type="number"
                inputMode="decimal"
                step="any"
                value={value}
                disabled={busy}
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
                disabled={busy}
                className={stepButtonClass}
                aria-label={`Add 1 to ${habit.title}`}
                onClick={() => stepBy(1)}
              >
                +1
              </button>
              {rule.target != null && rule.target >= 10 && (
                <button
                  type="button"
                  disabled={busy}
                  className={stepButtonClass}
                  aria-label={`Add 5 to ${habit.title}`}
                  onClick={() => stepBy(5)}
                >
                  +5
                </button>
              )}
              {rule.target != null && rule.goalDirection !== "record" && (
                <button
                  type="button"
                  disabled={busy}
                  className="min-h-10 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    const goal = rule.target as number;
                    setValue(String(goal));
                    void saveEntry({ date, value: goal });
                  }}
                >
                  Goal ({rule.target})
                </button>
              )}
            </form>
          ) : null}

          {showNotes && (
            <div id={notesId} className="mt-3 w-full">
              <label
                htmlFor={`note-input-${habit.id}`}
                className="block text-xs text-content-2"
              >
                {noteRequired ? "Completion note (required)" : "Optional note"}
              </label>
              <div className="mt-1 flex gap-2">
                <textarea
                  id={`note-input-${habit.id}`}
                  maxLength={280}
                  className="field-input flex-1"
                  value={note}
                  disabled={busy}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add details about your session..."
                  aria-describedby={!log ? `note-hint-${habit.id}` : undefined}
                />
                {log ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void saveNote()}
                  >
                    Save note
                  </Button>
                ) : null}
              </div>
              {!log ? (
                <p
                  id={`note-hint-${habit.id}`}
                  className="mt-1 text-xs text-content-muted"
                >
                  {noteRequired
                    ? "Write your note, then tick the habit to complete it."
                    : "Complete the habit to add a note — anything written here is saved with it."}
                </p>
              ) : null}
            </div>
          )}

          {habit.streakRepair && (
            <StreakRepairBanner
              className="mt-3"
              habitId={habit.id}
              habitTitle={habit.title}
              offer={habit.streakRepair}
            />
          )}

          {error && (
            <p
              role="alert"
              className="mt-2 text-xs text-rose-600 font-semibold"
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
  hideHeader?: boolean;
} = {}) => {
  const {
    selectedDate,
    setSelectedDate,
    shiftSelectedDate,
    resetSelectedDate
  } = useHomeDateStore();
  const query = useHabits(selectedDate);
  const saveMutation = useSaveHabitLog();
  const deleteMutation = useDeleteHabitLog();

  const lock = useRef(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const busy = savingId !== null;

  const today = getTodayDateString();
  const habits = query.data ?? [];
  const withState = habits.map((habit) => ({
    habit,
    state: dayState(habit, habit.recentDays, selectedDate, today)
  }));
  const activeHabits = withState.filter((h) => h.state !== "rest");
  const restingHabits = withState.filter((h) => h.state === "rest");
  const dueHabits = activeHabits.filter((h) => h.state !== "skipped");
  const openCreateHabit = useCreateHabitModalStore((s) => s.open);
  const done = dueHabits.filter((h) => h.state === "completed").length;
  const allCompleted = dueHabits.length > 0 && done === dueHabits.length;

  /** Serialises saves: only one log change is in flight at a time. */
  const withLock = async <T,>(
    habit: HabitListItem,
    task: () => Promise<T>
  ): Promise<T | null> => {
    if (lock.current) return null;
    lock.current = true;
    setSavingId(habit.id);
    try {
      return await task();
    } finally {
      lock.current = false;
      setSavingId(null);
    }
  };

  const save: SaveFn = (h, input, feedback) =>
    withLock(h, async () => ({
      log: await saveMutation.mutateAsync({
        habitId: h.id,
        logId: h.selectedDateLog?.id,
        input,
        feedback
      })
    }));

  const undo: UndoFn = (h, feedback) => {
    const logId = h.selectedDateLog?.id;
    if (!logId) return Promise.resolve({});
    return withLock(h, async () => {
      await deleteMutation.mutateAsync({ habitId: h.id, logId, feedback });
      return {};
    });
  };

  if (query.isLoading) return <p role="status">Loading your habits…</p>;
  if (query.isError)
    return (
      <div role="alert" className="surface-card p-6 text-sm">
        Could not load your habits.{" "}
        <Button onClick={() => void query.refetch()}>Retry</Button>
      </div>
    );

  const renderCard = (habit: HabitListItem, resting = false) => (
    <DailyCard
      key={`${habit.id}-${selectedDate}`}
      habit={habit}
      date={selectedDate}
      onSave={save}
      onUndo={undo}
      busy={busy}
      saving={savingId === habit.id}
      resting={resting}
    />
  );

  return (
    <div className="space-y-6">
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
        <FirstHabitEmptyState />
      ) : (
        <>
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
                  <strong>
                    {selectedDate === today
                      ? "No quests due today"
                      : "No quests due this day"}
                  </strong>
                )}
              </div>
              {allCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-400">
                  <Check className="h-3 w-3 stroke-[3]" aria-hidden /> All done!
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                aria-label="Previous day"
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
                max={today}
                value={selectedDate}
                disabled={busy}
                onChange={(e) =>
                  e.target.value && setSelectedDate(e.target.value)
                }
                className="rounded-xl border border-border-app bg-surface p-2 text-sm"
              />
              <Button
                variant="ghost"
                aria-label="Next day"
                disabled={busy || selectedDate >= today}
                onClick={() => shiftSelectedDate(1)}
              >
                ›
              </Button>
              <Button
                variant="ghost"
                disabled={busy || selectedDate === today}
                onClick={resetSelectedDate}
              >
                Today
              </Button>
            </div>
          </section>

          <p className="text-sm text-content-muted">
            {formatDateLabel(selectedDate)} · Tick a habit to complete it and
            earn XP.
            {selectedDate < today &&
              " Past days can still be logged, but only today can be skipped."}
          </p>

          {activeHabits.length > 0 && (
            <div className="grid gap-4 xl:grid-cols-2">
              {activeHabits.map(({ habit }) => renderCard(habit))}
            </div>
          )}

          {restingHabits.length > 0 && (
            <section aria-labelledby="resting-heading" className="space-y-3">
              <h2
                id="resting-heading"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-content-muted"
              >
                <Moon className="h-3.5 w-3.5" aria-hidden />
                {selectedDate === today ? "Not due today" : "Not due this day"}
              </h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {restingHabits.map(({ habit }) => renderCard(habit, true))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
