import { Link } from "react-router-dom";

import { StatPill } from "../../../components/ui/StatPill";
import { formatShortDateLabel } from "../../../shared/lib/date";
import { getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn } from "../../../shared/lib/utils";
import type { ActionStatus, HabitListItem } from "../../../shared/types/habit";
import { HabitCard } from "./HabitCard";

type ActionHabitCardProps = {
  habit: HabitListItem;
  isSaving?: boolean;
  onSave: (status: ActionStatus) => Promise<void> | void;
};

const statusStyles: Record<"done" | "not_done" | "empty", string> = {
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  not_done: "bg-rose-50 text-rose-700 ring-rose-200",
  empty: "bg-slate-100 text-slate-600 ring-slate-200"
};

export const ActionHabitCard = ({
  habit,
  isSaving,
  onSave
}: ActionHabitCardProps) => {
  const theme = getHabitTheme(habit.color);
  const currentStatus = habit.selectedDateLog?.status;
  const stats = habit.stats.type === "action" ? habit.stats : null;

  const badgeTone =
    currentStatus === "done"
      ? "done"
      : currentStatus === "not_done"
        ? "not_done"
        : "empty";

  return (
    <HabitCard
      habitId={habit.id}
      color={habit.color}
      title={habit.title}
      label="Action"
      badge={
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold ring-1",
            statusStyles[badgeTone]
          )}
        >
          {currentStatus === "done"
            ? "Done"
            : currentStatus === "not_done"
              ? "Not done"
              : "No log yet"}
        </span>
      }
      summary={
        stats ? (
          <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-slate-500">
              Current streak
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {stats.currentStreak} day{stats.currentStreak === 1 ? "" : "s"}
            </p>
          </div>
        ) : null
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {stats?.lastCompletedDate
              ? `Last completed ${formatShortDateLabel(stats.lastCompletedDate)}`
              : "No completed days yet"}
          </p>
          <Link
            to={`/habits/${habit.id}`}
            className="text-sm font-semibold text-indigo-700 transition hover:text-indigo-800"
          >
            View details
          </Link>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => void onSave("done")}
          disabled={isSaving}
          className={cn(
            "flex h-14 items-center justify-center rounded-2xl border font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
            currentStatus === "done"
              ? cn("border-transparent text-white", theme.button)
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-200"
          )}
        >
          {isSaving && currentStatus !== "done" ? "Saving..." : "Done"}
        </button>
        <button
          type="button"
          onClick={() => void onSave("not_done")}
          disabled={isSaving}
          className={cn(
            "flex h-14 items-center justify-center rounded-2xl border font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
            currentStatus === "not_done"
              ? "border-transparent bg-rose-600 text-white focus-visible:ring-rose-300"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-200"
          )}
        >
          {isSaving && currentStatus !== "not_done" ? "Saving..." : "Not done"}
        </button>
      </div>

      {stats ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatPill
            label="Current streak"
            value={`${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`}
          />
          <StatPill
            label="Last completed"
            value={
              stats.lastCompletedDate
                ? formatShortDateLabel(stats.lastCompletedDate)
                : "No completed date"
            }
          />
        </div>
      ) : null}
    </HabitCard>
  );
};
