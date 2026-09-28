import { formatDateLabel } from "../../../shared/lib/date";
import { formatValueWithUnit } from "../../../shared/lib/utils";
import type { HabitLog, HabitType } from "../../../shared/types/habit";

type RecentEntriesListProps = {
  habitType: HabitType;
  unit?: string;
  logs: HabitLog[];
};

const chip = "inline-flex rounded-full px-3 py-1 text-sm font-semibold";

const StatusChip = ({
  log,
  habitType,
  unit
}: {
  log: HabitLog;
  habitType: HabitType;
  unit?: string;
}) => {
  if (log.frozen) {
    return (
      <span
        className={`${chip} bg-cyan-500/10 text-cyan-700 dark:text-cyan-300`}
        title="Excused by a streak repair"
      >
        Frozen ❄️
      </span>
    );
  }
  if (log.status === "skipped") {
    return (
      <span className={`${chip} bg-amber-500/10 text-amber-700 dark:text-amber-400`}>
        Skipped
      </span>
    );
  }
  if (habitType === "action") {
    return log.status === "done" ? (
      <span className={`${chip} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`}>
        Done
      </span>
    ) : (
      <span className={`${chip} bg-rose-500/10 text-rose-700 dark:text-rose-400`}>
        Missed
      </span>
    );
  }
  return (
    <p className="text-base font-bold text-content">
      {log.value == null ? "—" : formatValueWithUnit(log.value, unit)}
    </p>
  );
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
    <ul className="space-y-3">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex flex-col gap-3 rounded-2xl border border-border-app bg-surface-2/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-content">
              {formatDateLabel(log.date)}
            </p>
            <p className="text-sm text-content-muted">{log.date}</p>
          </div>

          <div className="text-left sm:text-right">
            <StatusChip log={log} habitType={habitType} unit={unit} />
            {log.comment ? (
              <p className="mt-2 max-w-md text-sm leading-6 text-content-2">
                {log.comment}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
};
