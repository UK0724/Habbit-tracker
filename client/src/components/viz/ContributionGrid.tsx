import { getTodayDateString } from "../../shared/lib/date";
import { cn } from "../../shared/lib/utils";
import type { DayCell } from "../../features/stats/lib/analytics";

type ContributionGridProps = {
  columns: DayCell[][];
  mode: "action" | "measurable";
  baseColor: string;
  maxValue?: number;
  className?: string;
};

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * GitHub-style contribution heatmap. For action habits, "done" cells fill
 * with the habit color and "not done" cells show a faint rose. For
 * measurable habits, cell opacity scales with the logged value.
 */
export const ContributionGrid = ({
  columns,
  mode,
  baseColor,
  maxValue = 1,
  className
}: ContributionGridProps) => {
  const today = getTodayDateString();

  const cellStyle = (cell: DayCell) => {
    const isFuture = cell.date > today;
    if (isFuture) {
      return { background: "transparent", border: "1px dashed rgb(var(--border))" };
    }
    if (!cell.hasLog) {
      return { background: "rgb(var(--surface-3))" };
    }
    if (cell.frozen) {
      return { background: hexToRgba("#06b6d4", 0.55) };
    }
    if (mode === "action") {
      if (cell.status === "done") {
        return { background: baseColor };
      }
      return { background: hexToRgba("#f43f5e", 0.28) };
    }
    // measurable: scale opacity with value
    const intensity =
      cell.value !== null && maxValue > 0
        ? 0.25 + 0.75 * Math.min(1, cell.value / maxValue)
        : 0.25;
    return { background: hexToRgba(baseColor, intensity) };
  };

  const tooltip = (cell: DayCell) => {
    if (cell.date > today) {
      return cell.date;
    }
    if (!cell.hasLog) {
      return `${cell.date} · no log`;
    }
    if (cell.frozen) {
      return `${cell.date} · frozen ❄️`;
    }
    if (mode === "action") {
      return `${cell.date} · ${cell.status === "done" ? "done" : "not done"}`;
    }
    return `${cell.date} · ${cell.value ?? "—"}`;
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex gap-[3px]">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-[3px]">
            {column.map((cell) => (
              <div
                key={cell.date}
                title={tooltip(cell)}
                className="h-3 w-3 rounded-[3px] transition-transform hover:scale-125"
                style={cellStyle(cell)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
