import { Button } from "../../../components/ui/Button";
import { getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn } from "../../../shared/lib/utils";
import type { Habit } from "../../../shared/types/habit";
import {
  useArchivedHabits,
  useDeleteHabit,
  useSetHabitArchived
} from "../hooks/useHabits";

const typeLabel = (type: Habit["type"]) =>
  type === "action" ? "Action" : type === "expense" ? "Expense" : "Measurable";

const ArchivedHabitRow = ({ habit }: { habit: Habit }) => {
  const restore = useSetHabitArchived();
  const remove = useDeleteHabit(habit.id);
  const theme = getHabitTheme(habit.color);

  const handleDelete = () => {
    if (
      !window.confirm(
        `Permanently delete "${habit.title}" and all of its logs? This can't be undone.`
      )
    ) {
      return;
    }
    remove.mutate();
  };

  const busy = restore.isPending || remove.isPending;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border-app bg-surface px-3 py-3">
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", theme.accent)} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-content">{habit.title}</p>
        <p className="text-xs text-content-muted">{typeLabel(habit.type)}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => restore.mutate({ id: habit.id, archived: false })}
        disabled={busy}
      >
        {restore.isPending ? "Restoring..." : "Restore"}
      </Button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50"
      >
        {remove.isPending ? "…" : "Delete"}
      </button>
    </div>
  );
};

export const ArchivedHabits = () => {
  const { data } = useArchivedHabits();
  const archived = data ?? [];

  if (archived.length === 0) {
    return null;
  }

  return (
    <details className="surface-card group p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="text-lg font-bold text-content">
          Archived
          <span className="ml-2 rounded-full bg-surface-3 px-2 py-0.5 text-xs font-semibold text-content-muted">
            {archived.length}
          </span>
        </span>
        <span className="text-sm font-semibold text-content-muted transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <p className="mt-1 text-sm text-content-muted">
        Hidden from your board but kept safe. Restore anytime, or delete for
        good.
      </p>
      <div className="mt-4 space-y-2">
        {archived.map((habit) => (
          <ArchivedHabitRow key={habit.id} habit={habit} />
        ))}
      </div>
    </details>
  );
};
