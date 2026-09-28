import { Archive } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
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
    restore.reset();
    remove.mutate();
  };

  const handleRestore = () => {
    remove.reset();
    restore.mutate({ id: habit.id, archived: false });
  };

  const busy = restore.isPending || remove.isPending;
  const error = restore.error
    ? `Could not restore: ${restore.error.message}`
    : remove.error
      ? `Could not delete: ${remove.error.message}`
      : null;

  return (
    <li className="rounded-2xl border border-border-app bg-surface px-3 py-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={cn("h-2.5 w-2.5 shrink-0 rounded-full", theme.accent)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-content">{habit.title}</p>
          <p className="text-xs text-content-muted">{typeLabel(habit.type)}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleRestore}
          disabled={busy}
          aria-label={`Restore ${habit.title}`}
        >
          {restore.isPending ? "Restoring…" : "Restore"}
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          aria-label={`Delete ${habit.title} permanently`}
          className="min-h-10 rounded-lg px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50"
        >
          {remove.isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
          {error}
        </p>
      ) : null}
    </li>
  );
};

export const ArchivedHabits = () => {
  const { data, isLoading, isError, refetch, isFetching } = useArchivedHabits();
  const archived = data ?? [];

  if (isLoading) {
    return (
      <div role="status" className="surface-card p-8 text-center text-sm text-content-muted">
        Loading archived habits…
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="surface-card p-6 text-center">
        <p className="text-sm font-medium text-rose-600">
          Could not load archived habits.
        </p>
        <Button
          variant="ghost"
          className="mt-3"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (archived.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="No archived habits"
        description="When you archive a habit it moves here with its history intact. You can restore it at any time."
      />
    );
  }

  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="archived-heading">
      <h2 id="archived-heading" className="text-lg font-bold text-content">
        Archived
        <span className="ml-2 rounded-full bg-surface-3 px-2 py-0.5 text-xs font-semibold text-content-muted">
          {archived.length}
        </span>
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        Hidden from your board but kept safe. Restore anytime, or delete for
        good.
      </p>
      <ul className="mt-4 space-y-2">
        {archived.map((habit) => (
          <ArchivedHabitRow key={habit.id} habit={habit} />
        ))}
      </ul>
    </section>
  );
};
