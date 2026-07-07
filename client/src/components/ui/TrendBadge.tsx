import type { Trend } from "../../shared/types/habit";
import { cn } from "../../shared/lib/utils";

type TrendBadgeProps = {
  trend: Trend;
  label?: string | null;
};

const trendClasses: Record<Trend, string> = {
  up: "bg-amber-500/10 text-amber-600 ring-amber-500/30",
  down: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/30",
  same: "bg-surface-3 text-content-2 ring-border-app",
  none: "bg-surface-3 text-content-muted ring-border-app"
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
