import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { NumberInput } from "../../../components/ui/NumberInput";
import { TrendBadge } from "../../../components/ui/TrendBadge";
import { formatShortDateLabel } from "../../../shared/lib/date";
import { formatValueWithUnit } from "../../../shared/lib/utils";
import type { HabitListItem } from "../../../shared/types/habit";
import { HabitCard } from "./HabitCard";

type MeasurableHabitCardProps = {
  habit: HabitListItem;
  isSaving?: boolean;
  onSave: (value: number) => Promise<void> | void;
};

export const MeasurableHabitCard = ({
  habit,
  isSaving,
  onSave
}: MeasurableHabitCardProps) => {
  const stats = habit.stats.type === "measurable" ? habit.stats : null;
  const [value, setValue] = useState(
    habit.selectedDateLog?.value?.toString() ?? ""
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setValue(habit.selectedDateLog?.value?.toString() ?? "");
    setLocalError(null);
  }, [habit.selectedDateLog?.id, habit.selectedDateLog?.value]);

  const handleSave = () => {
    const numericValue = Number(value);

    if (!value.length || Number.isNaN(numericValue)) {
      setLocalError("Enter a valid number before saving.");
      return;
    }

    setLocalError(null);
    void onSave(numericValue);
  };

  return (
    <HabitCard
      habitId={habit.id}
      color={habit.color}
      title={habit.title}
      label="Measurable"
      badge={
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          {habit.unit ?? "Unit"}
        </span>
      }
      summary={
        stats ? (
          <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-slate-500">Latest value</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {stats.latestValue !== null
                ? formatValueWithUnit(stats.latestValue, habit.unit)
                : "No value yet"}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <TrendBadge
                trend={stats.trend}
                label={stats.trend === "none" ? "No trend yet" : stats.trend}
              />
            </div>
          </div>
        ) : null
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {habit.selectedDateLog
              ? `Updated for ${formatShortDateLabel(habit.selectedDateLog.date)}`
              : "No value saved for this day"}
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <NumberInput
            value={value}
            unit={habit.unit}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Enter today's value"
          />
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-32"
        >
          {isSaving
            ? "Saving..."
            : habit.selectedDateLog
              ? "Update value"
              : "Save value"}
        </Button>
      </div>

      {localError ? (
        <p className="mt-3 text-sm font-medium text-rose-600">{localError}</p>
      ) : null}

      {stats ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Latest
            </p>
            <p className="mt-2 text-base font-bold text-slate-950">
              {stats.latestValue !== null
                ? formatValueWithUnit(stats.latestValue, habit.unit)
                : "No value yet"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Previous
            </p>
            <p className="mt-2 text-base font-bold text-slate-950">
              {stats.previousValue !== null
                ? formatValueWithUnit(stats.previousValue, habit.unit)
                : "No previous value"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Trend
            </p>
            <p className="mt-2 text-base font-bold text-slate-950">
              {stats.differenceLabel ?? "Add another entry to see a trend"}
            </p>
          </div>
        </div>
      ) : null}
    </HabitCard>
  );
};
