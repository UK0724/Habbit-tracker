import type { Trend } from "../../shared/types/habit";
import { cn } from "../../shared/lib/utils";

type TrendBadgeProps = {
  trend: Trend;
  label?: string | null;
};

const trendClasses: Record<Trend, string> = {
  up: "bg-amber-50 text-amber-700 ring-amber-200",
  down: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  same: "bg-slate-100 text-slate-700 ring-slate-200",
  none: "bg-slate-100 text-slate-500 ring-slate-200"
};

export const TrendBadge = ({ trend, label }: TrendBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
      trendClasses[trend]
    )}
  >
    {label ?? trend}
  </span>
);
