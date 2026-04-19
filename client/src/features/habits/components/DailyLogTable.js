import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { NumberInput } from "../../../components/ui/NumberInput";
import { formatShortDateLabel } from "../../../shared/lib/date";
import { getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn, formatValueWithUnit } from "../../../shared/lib/utils";
const actionButtonClassName = "inline-flex min-w-28 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60";
const statusText = {
    done: "Done",
    not_done: "Not done"
};
const getActionEntryLabel = (status, selectedDate) => {
    if (status === "done") {
        return `Marked done for ${formatShortDateLabel(selectedDate)}`;
    }
    if (status === "not_done") {
        return `Marked not done for ${formatShortDateLabel(selectedDate)}`;
    }
    return `No entry yet for ${formatShortDateLabel(selectedDate)}`;
};
const getMeasurableEntryLabel = (value, unit, selectedDate) => {
    if (value === null || value === undefined) {
        return `No value yet for ${formatShortDateLabel(selectedDate)}`;
    }
    return `Saved ${formatValueWithUnit(value, unit)} for ${formatShortDateLabel(selectedDate)}`;
};
const HabitIdentity = ({ habit, compact = false }) => {
    const theme = getHabitTheme(habit.color);
    return (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: cn("mt-1 h-3 w-3 rounded-full", theme.accent) }), _jsxs("div", { className: "min-w-0", children: [_jsx(Link, { to: `/habits/${habit.id}`, className: "text-base font-semibold text-slate-950 transition hover:text-indigo-700", children: habit.title }), _jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: cn("rounded-full px-2.5 py-1 text-xs font-semibold ring-1", theme.soft), children: habit.type === "action" ? "Action" : "Measurable" }), habit.unit ? (_jsx("span", { className: "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200", children: habit.unit })) : null] }), habit.description ? (_jsx("p", { className: cn("mt-2 text-sm leading-6 text-slate-500", compact ? "" : "max-w-md"), children: habit.description })) : null] })] }));
};
const HabitNameCell = ({ habit }) => (_jsx("td", { className: "px-4 py-4 align-top", children: _jsx(HabitIdentity, { habit: habit }) }));
const ActionSummary = ({ stats }) => (_jsxs("div", { className: "space-y-1 text-sm", children: [_jsx("p", { className: "font-semibold text-slate-900", children: stats
                ? `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"} streak`
                : "No streak yet" }), _jsx("p", { className: "text-slate-500", children: stats?.lastCompletedDate
                ? `Last completed ${formatShortDateLabel(stats.lastCompletedDate)}`
                : "No completed day yet" })] }));
const MeasurableSummary = ({ stats, unit }) => (_jsxs("div", { className: "space-y-1 text-sm", children: [_jsx("p", { className: "font-semibold text-slate-900", children: stats?.latestValue !== null && stats?.latestValue !== undefined
                ? `Latest ${formatValueWithUnit(stats.latestValue, unit)}`
                : "No values yet" }), _jsx("p", { className: "text-slate-500", children: stats?.previousValue !== null && stats?.previousValue !== undefined
                ? `Previous ${formatValueWithUnit(stats.previousValue, unit)}`
                : "No previous value yet" }), _jsx("p", { className: "text-slate-500", children: stats?.differenceLabel ?? "Add another value to see a trend" })] }));
const ActionHabitRow = ({ habit, isSaving, selectedDate, onSave }) => {
    const theme = getHabitTheme(habit.color);
    const currentStatus = habit.selectedDateLog?.status;
    const stats = habit.stats.type === "action" ? habit.stats : null;
    return (_jsxs("tr", { className: "bg-white", children: [_jsx(HabitNameCell, { habit: habit }), _jsxs("td", { className: "px-4 py-4 align-top", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: ["done", "not_done"].map((status) => {
                            const isActive = currentStatus === status;
                            return (_jsx("button", { type: "button", onClick: () => void onSave(habit.id, habit.selectedDateLog?.id, status), disabled: isSaving, className: cn(actionButtonClassName, isActive
                                    ? status === "done"
                                        ? cn("border-transparent text-white", theme.button)
                                        : "border-rose-600 bg-rose-600 text-white focus-visible:ring-rose-200"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-200"), children: isSaving && isActive ? "Saving..." : statusText[status] }, status));
                        }) }), _jsx("p", { className: "mt-2 text-xs font-medium text-slate-500", children: getActionEntryLabel(currentStatus, selectedDate) })] }), _jsx("td", { className: "px-4 py-4 align-top", children: _jsx(ActionSummary, { stats: stats }) }), _jsx("td", { className: "px-4 py-4 text-right align-top", children: _jsx(Link, { to: `/habits/${habit.id}`, className: "text-sm font-semibold text-slate-700 transition hover:text-slate-950", children: "Details" }) })] }));
};
const MeasurableHabitRow = ({ habit, isSaving, selectedDate, onSave }) => {
    const stats = habit.stats.type === "measurable" ? habit.stats : null;
    const [value, setValue] = useState(habit.selectedDateLog?.value?.toString() ?? "");
    const [localError, setLocalError] = useState(null);
    useEffect(() => {
        setValue(habit.selectedDateLog?.value?.toString() ?? "");
        setLocalError(null);
    }, [habit.selectedDateLog?.id, habit.selectedDateLog?.value]);
    const handleSubmit = (event) => {
        event.preventDefault();
        const numericValue = Number(value);
        if (!value.trim().length || Number.isNaN(numericValue)) {
            setLocalError("Enter a valid number.");
            return;
        }
        setLocalError(null);
        void onSave(habit.id, habit.selectedDateLog?.id, numericValue);
    };
    return (_jsxs("tr", { className: "bg-white", children: [_jsx(HabitNameCell, { habit: habit }), _jsxs("td", { className: "px-4 py-4 align-top", children: [_jsxs("form", { onSubmit: handleSubmit, className: "flex min-w-[280px] flex-wrap items-start gap-2", children: [_jsx("div", { className: "min-w-[180px] flex-1", children: _jsx(NumberInput, { value: value, unit: habit.unit, onChange: (event) => setValue(event.target.value), placeholder: "Enter value", className: "h-11 rounded-xl" }) }), _jsx(Button, { type: "submit", size: "sm", disabled: isSaving, className: "h-11", children: isSaving ? "Saving..." : "Save" })] }), _jsx("p", { className: "mt-2 text-xs font-medium text-slate-500", children: getMeasurableEntryLabel(habit.selectedDateLog?.value, habit.unit, selectedDate) }), localError ? (_jsx("p", { className: "mt-2 text-xs font-medium text-rose-600", children: localError })) : null] }), _jsx("td", { className: "px-4 py-4 align-top", children: _jsx(MeasurableSummary, { stats: stats, unit: habit.unit }) }), _jsx("td", { className: "px-4 py-4 text-right align-top", children: _jsx(Link, { to: `/habits/${habit.id}`, className: "text-sm font-semibold text-slate-700 transition hover:text-slate-950", children: "Details" }) })] }));
};
const MobileCardShell = ({ habit, children }) => (_jsxs("article", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx(HabitIdentity, { habit: habit, compact: true }), _jsx(Link, { to: `/habits/${habit.id}`, className: "shrink-0 text-sm font-semibold text-slate-700 transition hover:text-slate-950", children: "Details" })] }), children] }));
const MobileActionHabitCard = ({ habit, isSaving, selectedDate, onSave }) => {
    const theme = getHabitTheme(habit.color);
    const currentStatus = habit.selectedDateLog?.status;
    const stats = habit.stats.type === "action" ? habit.stats : null;
    return (_jsxs(MobileCardShell, { habit: habit, children: [_jsx("div", { className: "mt-4 grid grid-cols-2 gap-2", children: ["done", "not_done"].map((status) => {
                    const isActive = currentStatus === status;
                    return (_jsx("button", { type: "button", onClick: () => void onSave(habit.id, habit.selectedDateLog?.id, status), disabled: isSaving, className: cn(actionButtonClassName, "min-w-0 px-3", isActive
                            ? status === "done"
                                ? cn("border-transparent text-white", theme.button)
                                : "border-rose-600 bg-rose-600 text-white focus-visible:ring-rose-200"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-200"), children: isSaving && isActive ? "Saving..." : statusText[status] }, status));
                }) }), _jsx("p", { className: "mt-3 text-xs font-medium text-slate-500", children: getActionEntryLabel(currentStatus, selectedDate) }), _jsxs("div", { className: "mt-4 grid gap-2 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-xl bg-slate-50 px-3 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Streak" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-slate-900", children: stats
                                    ? `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`
                                    : "No streak yet" })] }), _jsxs("div", { className: "rounded-xl bg-slate-50 px-3 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Last completed" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-slate-900", children: stats?.lastCompletedDate
                                    ? formatShortDateLabel(stats.lastCompletedDate)
                                    : "No completed day" })] })] })] }));
};
const MobileMeasurableHabitCard = ({ habit, isSaving, selectedDate, onSave }) => {
    const stats = habit.stats.type === "measurable" ? habit.stats : null;
    const [value, setValue] = useState(habit.selectedDateLog?.value?.toString() ?? "");
    const [localError, setLocalError] = useState(null);
    useEffect(() => {
        setValue(habit.selectedDateLog?.value?.toString() ?? "");
        setLocalError(null);
    }, [habit.selectedDateLog?.id, habit.selectedDateLog?.value]);
    const handleSubmit = (event) => {
        event.preventDefault();
        const numericValue = Number(value);
        if (!value.trim().length || Number.isNaN(numericValue)) {
            setLocalError("Enter a valid number.");
            return;
        }
        setLocalError(null);
        void onSave(habit.id, habit.selectedDateLog?.id, numericValue);
    };
    return (_jsxs(MobileCardShell, { habit: habit, children: [_jsxs("form", { onSubmit: handleSubmit, className: "mt-4 space-y-3", children: [_jsx(NumberInput, { value: value, unit: habit.unit, onChange: (event) => setValue(event.target.value), placeholder: "Enter value", className: "h-11 rounded-xl" }), _jsx(Button, { type: "submit", disabled: isSaving, className: "w-full", size: "sm", children: isSaving ? "Saving..." : "Save value" })] }), _jsx("p", { className: "mt-3 text-xs font-medium text-slate-500", children: getMeasurableEntryLabel(habit.selectedDateLog?.value, habit.unit, selectedDate) }), localError ? (_jsx("p", { className: "mt-2 text-xs font-medium text-rose-600", children: localError })) : null, _jsxs("div", { className: "mt-4 grid gap-2", children: [_jsxs("div", { className: "rounded-xl bg-slate-50 px-3 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Latest" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-slate-900", children: stats?.latestValue !== null && stats?.latestValue !== undefined
                                    ? formatValueWithUnit(stats.latestValue, habit.unit)
                                    : "No values yet" })] }), _jsxs("div", { className: "rounded-xl bg-slate-50 px-3 py-3", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500", children: "Trend" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-slate-900", children: stats?.differenceLabel ?? "Add another value to see a trend" })] })] })] }));
};
export const DailyLogTable = ({ habits, selectedDate, savingHabitId, onSaveAction, onSaveValue }) => (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid gap-3 md:hidden", children: habits.map((habit) => habit.type === "action" ? (_jsx(MobileActionHabitCard, { habit: habit, selectedDate: selectedDate, isSaving: savingHabitId === habit.id, onSave: onSaveAction }, habit.id)) : (_jsx(MobileMeasurableHabitCard, { habit: habit, selectedDate: selectedDate, isSaving: savingHabitId === habit.id, onSave: onSaveValue }, habit.id))) }), _jsx("div", { className: "hidden overflow-hidden rounded-3xl border border-slate-200 bg-white md:block", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-[920px] w-full text-left", children: [_jsx("thead", { className: "bg-slate-50", children: _jsxs("tr", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-slate-500", children: [_jsx("th", { className: "px-4 py-3", children: "Habit" }), _jsxs("th", { className: "px-4 py-3", children: ["Entry for ", formatShortDateLabel(selectedDate)] }), _jsx("th", { className: "px-4 py-3", children: "Summary" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Open" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: habits.map((habit) => habit.type === "action" ? (_jsx(ActionHabitRow, { habit: habit, selectedDate: selectedDate, isSaving: savingHabitId === habit.id, onSave: onSaveAction }, habit.id)) : (_jsx(MeasurableHabitRow, { habit: habit, selectedDate: selectedDate, isSaving: savingHabitId === habit.id, onSave: onSaveValue }, habit.id))) })] }) }) })] }));
