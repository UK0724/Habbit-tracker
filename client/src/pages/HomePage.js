import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionCard } from "../components/ui/SectionCard";
import { DailyLogTable } from "../features/habits/components/DailyLogTable";
import { useHabits } from "../features/habits/hooks/useHabits";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import { useSaveHabitLog } from "../features/logs/hooks/useHabitLogs";
import { formatDateLabel, isToday } from "../shared/lib/date";
export const HomePage = () => {
    const selectedDate = useHomeDateStore((state) => state.selectedDate);
    const setSelectedDate = useHomeDateStore((state) => state.setSelectedDate);
    const shiftSelectedDate = useHomeDateStore((state) => state.shiftSelectedDate);
    const resetSelectedDate = useHomeDateStore((state) => state.resetSelectedDate);
    const habitsQuery = useHabits(selectedDate);
    const saveLogMutation = useSaveHabitLog();
    const [activeHabitId, setActiveHabitId] = useState(null);
    const handleSaveAction = async (habitId, logId, status) => {
        try {
            setActiveHabitId(habitId);
            await saveLogMutation.mutateAsync({
                habitId,
                logId,
                input: {
                    date: selectedDate,
                    status
                }
            });
        }
        finally {
            setActiveHabitId(null);
        }
    };
    const handleSaveValue = async (habitId, logId, value) => {
        try {
            setActiveHabitId(habitId);
            await saveLogMutation.mutateAsync({
                habitId,
                logId,
                input: {
                    date: selectedDate,
                    value
                }
            });
        }
        finally {
            setActiveHabitId(null);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(SectionCard, { className: "border border-slate-200", children: _jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "max-w-2xl", children: [_jsx("p", { className: "text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600", children: "Daily log" }), _jsx("h1", { className: "mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl", children: "Update habits in one place" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-slate-600 sm:text-base", children: "Pick any date, fill each row, and backfill missed entries without jumping between oversized cards." }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700", children: isToday(selectedDate)
                                                ? "Editing today"
                                                : `Backfilling ${formatDateLabel(selectedDate)}` }), _jsx("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700", children: "One row per habit" })] })] }), _jsxs("div", { className: "flex w-full max-w-xl flex-col gap-3 lg:items-end", children: [_jsxs("div", { className: "grid w-full gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:grid-cols-[auto,1fr,auto,auto] sm:items-center", children: [_jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => shiftSelectedDate(-1), className: "w-full sm:w-auto", children: "Previous" }), _jsx("input", { type: "date", value: selectedDate, onChange: (event) => setSelectedDate(event.target.value), className: "h-10 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100" }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => shiftSelectedDate(1), className: "w-full sm:w-auto", children: "Next" }), !isToday(selectedDate) ? (_jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: resetSelectedDate, className: "w-full sm:w-auto", children: "Today" })) : null] }), _jsx(Button, { asChild: true, size: "sm", className: "w-full sm:w-auto", children: _jsx(Link, { to: "/habits/new", children: "Create habit" }) })] })] }) }), saveLogMutation.error ? (_jsx(SectionCard, { className: "border border-rose-200 bg-rose-50/60", children: _jsx("p", { className: "text-sm font-medium text-rose-700", children: saveLogMutation.error.message }) })) : null, habitsQuery.isLoading ? (_jsx(SectionCard, { title: `Habits for ${formatDateLabel(selectedDate)}`, description: "Loading your daily log...", children: _jsx("div", { className: "overflow-hidden rounded-3xl border border-slate-200", children: Array.from({ length: 4 }).map((_, index) => (_jsx("div", { className: "h-20 animate-pulse border-b border-slate-100 bg-slate-50/80 last:border-b-0" }, index))) }) })) : null, habitsQuery.isError ? (_jsx(SectionCard, { title: "Unable to load habits", children: _jsx("p", { className: "text-sm text-rose-700", children: habitsQuery.error.message }) })) : null, !habitsQuery.isLoading &&
                !habitsQuery.isError &&
                !habitsQuery.data?.length ? (_jsx(EmptyState, { title: "No habits created yet", description: "Create your first habit to start logging action-based check-ins or measurable daily values.", actionHref: "/habits/new", actionLabel: "Create your first habit" })) : null, !habitsQuery.isLoading &&
                !habitsQuery.isError &&
                habitsQuery.data?.length ? (_jsx(SectionCard, { title: `Habits for ${formatDateLabel(selectedDate)}`, description: isToday(selectedDate)
                    ? "Action habits save immediately. Measurable habits save when you press Save."
                    : "Missed a day? Fill the rows below and the selected date updates right away.", children: _jsx(DailyLogTable, { habits: habitsQuery.data, selectedDate: selectedDate, savingHabitId: saveLogMutation.isPending ? activeHabitId : null, onSaveAction: handleSaveAction, onSaveValue: handleSaveValue }) })) : null] }));
};
