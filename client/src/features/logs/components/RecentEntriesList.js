import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDateLabel } from "../../../shared/lib/date";
import { formatValueWithUnit } from "../../../shared/lib/utils";
export const RecentEntriesList = ({ habitType, unit, logs }) => {
    if (!logs.length) {
        return (_jsx("div", { className: "rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500", children: "No logs yet." }));
    }
    return (_jsx("div", { className: "space-y-3", children: logs.map((log) => (_jsxs("div", { className: "flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900", children: formatDateLabel(log.date) }), _jsx("p", { className: "text-sm text-slate-500", children: log.date })] }), _jsx("div", { children: habitType === "action" ? (_jsx("span", { className: `inline-flex rounded-full px-3 py-1 text-sm font-semibold ${log.status === "done"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"}`, children: log.status === "done" ? "Done" : "Not done" })) : (_jsx("p", { className: "text-base font-bold text-slate-950", children: formatValueWithUnit(log.value ?? 0, unit) })) })] }, log.id))) }));
};
