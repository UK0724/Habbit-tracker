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
      <div className="rounded-2xl border border-dashed border-border-app bg-surface-2/70 px-4 py-5 text-sm text-content-muted">
        No logs yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex flex-col gap-3 rounded-2xl border border-border-app bg-surface-2/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-content">
              {formatDateLabel(log.date)}
            </p>
            <p className="text-sm text-content-muted">{log.date}</p>
          </div>

          <div>
            {habitType === "action" ? (
              <div className="text-left sm:text-right">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    log.status === "done"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-rose-500/10 text-rose-600"
                  }`}
                >
                  {log.status === "done" ? "Done" : "Not done"}
                </span>
                {log.comment ? (
                  <p className="mt-2 max-w-md text-sm leading-6 text-content-2">
                    {log.comment}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-base font-bold text-content">
                {formatValueWithUnit(log.value ?? 0, unit)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
