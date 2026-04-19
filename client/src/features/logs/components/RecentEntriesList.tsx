import { formatDateLabel } from "../../../shared/lib/date";
import { formatValueWithUnit } from "../../../shared/lib/utils";
import type { HabitLog, HabitType } from "../../../shared/types/habit";

type RecentEntriesListProps = {
  habitType: HabitType;
  unit?: string;
  logs: HabitLog[];
};

export const RecentEntriesList = ({
  habitType,
  unit,
  logs
}: RecentEntriesListProps) => {
  if (!logs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
        No logs yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-slate-900">
              {formatDateLabel(log.date)}
            </p>
            <p className="text-sm text-slate-500">{log.date}</p>
          </div>

          <div>
            {habitType === "action" ? (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  log.status === "done"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {log.status === "done" ? "Done" : "Not done"}
              </span>
            ) : (
              <p className="text-base font-bold text-slate-950">
                {formatValueWithUnit(log.value ?? 0, unit)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
