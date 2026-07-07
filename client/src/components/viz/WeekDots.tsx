import { getTodayDateString } from "../../shared/lib/date";
import { cn } from "../../shared/lib/utils";
import type { DayCell } from "../../features/stats/lib/analytics";

type WeekDotsProps = {
  days: DayCell[];
  mode: "action" | "measurable";
  baseColor: string;
  showLabels?: boolean;
  className?: string;
};

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

const dowOf = (date: string) => {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
};

/** A compact strip of the last N days — the "don't break the chain" nudge. */
export const WeekDots = ({
  days,
  mode,
  baseColor,
  showLabels = true,
  className
}: WeekDotsProps) => {
  const today = getTodayDateString();

  return (
    <div className={cn("flex items-end gap-1.5", className)}>
      {days.map((cell) => {
        const isToday = cell.date === today;
        const done = mode === "action" ? cell.status === "done" : cell.hasLog;
        const missed = mode === "action" && cell.status === "not_done";

        return (
          <div key={cell.date} className="flex flex-col items-center gap-1">
            <span
              title={cell.date}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition",
                isToday && "ring-2 ring-offset-1 ring-border-app"
              )}
              style={
                done
                  ? { background: baseColor, color: "#fff" }
                  : missed
                    ? { background: "rgba(244,63,94,0.18)", color: "#e11d48" }
                    : {
                        background: "rgb(var(--surface-3))",
                        color: "rgb(var(--text-subtle))"
                      }
              }
            >
              {done ? "✓" : missed ? "✕" : ""}
            </span>
            {showLabels ? (
              <span className="text-[10px] font-semibold text-content-subtle">
                {WEEKDAY[dowOf(cell.date)]}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
