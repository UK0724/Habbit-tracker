import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../shared/lib/utils";
const trendClasses = {
    up: "bg-amber-50 text-amber-700 ring-amber-200",
    down: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    same: "bg-slate-100 text-slate-700 ring-slate-200",
    none: "bg-slate-100 text-slate-500 ring-slate-200"
};
export const TrendBadge = ({ trend, label }) => (_jsx("span", { className: cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1", trendClasses[trend]), children: label ?? trend }));
