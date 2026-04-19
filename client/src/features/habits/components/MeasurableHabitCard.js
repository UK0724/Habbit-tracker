import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { NumberInput } from "../../../components/ui/NumberInput";
import { TrendBadge } from "../../../components/ui/TrendBadge";
import { formatShortDateLabel } from "../../../shared/lib/date";
import { formatValueWithUnit } from "../../../shared/lib/utils";
import { HabitCard } from "./HabitCard";
export const MeasurableHabitCard = ({ habit, isSaving, onSave }) => {
    const stats = habit.stats.type === "measurable" ? habit.stats : null;
    const [value, setValue] = useState(habit.selectedDateLog?.value?.toString() ?? "");
    const [localError, setLocalError] = useState(null);
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
    return (_jsxs(HabitCard, { habitId: habit.id, color: habit.color, title: habit.title, label: "Measurable", badge: _jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200", children: habit.unit ?? "Unit" }), summary: stats ? (_jsxs("div", { className: "rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100", children: [_jsx("p", { className: "text-sm font-semibold text-slate-500", children: "Latest value" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-slate-950", children: stats.latestValue !== null
                        ? formatValueWithUnit(stats.latestValue, habit.unit)
                        : "No value yet" }), _jsx("div", { className: "mt-3 flex items-center gap-2", children: _jsx(TrendBadge, { trend: stats.trend, label: stats.trend === "none" ? "No trend yet" : stats.trend }) })] })) : null, footer: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-sm text-slate-500", children: habit.selectedDateLog
                        ? `Updated for ${formatShortDateLabel(habit.selectedDateLog.date)}`
                        : "No value saved for this day" }), _jsx(Link, { to: `/habits/${habit.id}`, className: "text-sm font-semibold text-indigo-700 transition hover:text-indigo-800", children: "View details" })] }), children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row", children: [_jsx("div", { className: "flex-1", children: _jsx(NumberInput, { value: value, unit: habit.unit, onChange: (event) => setValue(event.target.value), placeholder: "Enter today's value" }) }), _jsx(Button, { type: "button", onClick: handleSave, disabled: isSaving, className: "min-w-32", children: isSaving
                            ? "Saving..."
                            : habit.selectedDateLog
                                ? "Update value"
                                : "Save value" })] }), localError ? (_jsx("p", { className: "mt-3 text-sm font-medium text-rose-600", children: localError })) : null, stats ? (_jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", children: "Latest" }), _jsx("p", { className: "mt-2 text-base font-bold text-slate-950", children: stats.latestValue !== null
                                    ? formatValueWithUnit(stats.latestValue, habit.unit)
                                    : "No value yet" })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", children: "Previous" }), _jsx("p", { className: "mt-2 text-base font-bold text-slate-950", children: stats.previousValue !== null
                                    ? formatValueWithUnit(stats.previousValue, habit.unit)
                                    : "No previous value" })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", children: "Trend" }), _jsx("p", { className: "mt-2 text-base font-bold text-slate-950", children: stats.differenceLabel ?? "Add another entry to see a trend" })] })] })) : null] }));
};
