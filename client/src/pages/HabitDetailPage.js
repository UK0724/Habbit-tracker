import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { StatPill } from "../components/ui/StatPill";
import { TrendBadge } from "../components/ui/TrendBadge";
import { useHabit } from "../features/habits/hooks/useHabits";
import { RecentEntriesList } from "../features/logs/components/RecentEntriesList";
import { useHabitLogs } from "../features/logs/hooks/useHabitLogs";
import { useHabitStats } from "../features/stats/hooks/useHabitStats";
import { formatDateLabel, formatShortDateLabel } from "../shared/lib/date";
import { formatValueWithUnit } from "../shared/lib/utils";
export const HabitDetailPage = () => {
    const { id } = useParams();
    const habitQuery = useHabit(id);
    const statsQuery = useHabitStats(id);
    const logsQuery = useHabitLogs(id, 12);
    if (habitQuery.isLoading) {
        return _jsx("div", { className: "surface-card h-96 animate-pulse bg-white/80" });
    }
    if (habitQuery.isError || !habitQuery.data) {
        return (_jsx(SectionCard, { title: "Unable to load habit", children: _jsx("p", { className: "text-sm text-rose-700", children: habitQuery.error?.message ?? "This habit could not be found." }) }));
    }
    const habit = habitQuery.data;
    const stats = statsQuery.data;
    const logs = logsQuery.data ?? [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(PageHeader, { eyebrow: habit.type === "action" ? "Action habit" : "Measurable habit", title: habit.title, description: habit.description || "No description added yet.", actions: _jsxs(_Fragment, { children: [_jsx(Button, { asChild: true, variant: "secondary", children: _jsx(Link, { to: "/", children: "Back to today" }) }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: `/habits/${habit.id}/edit`, children: "Edit habit" }) })] }) }), statsQuery.isError ? (_jsx(SectionCard, { children: _jsx("p", { className: "text-sm text-rose-700", children: statsQuery.error.message }) })) : null, habit.type === "action" && stats && stats.type === "action" ? (_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(StatPill, { label: "Current streak", value: `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`, className: "surface-card border-0 bg-white px-5 py-5 shadow-panel" }), _jsx(StatPill, { label: "Last completed", value: stats.lastCompletedDate
                            ? formatDateLabel(stats.lastCompletedDate)
                            : "No completed date yet", className: "surface-card border-0 bg-white px-5 py-5 shadow-panel" })] })) : null, habit.type === "measurable" && stats && stats.type === "measurable" ? (_jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsx(StatPill, { label: "Latest value", value: stats.latestValue !== null
                            ? formatValueWithUnit(stats.latestValue, habit.unit)
                            : "No value yet", className: "surface-card border-0 bg-white px-5 py-5 shadow-panel" }), _jsx(StatPill, { label: "Previous value", value: stats.previousValue !== null
                            ? formatValueWithUnit(stats.previousValue, habit.unit)
                            : "No previous value", className: "surface-card border-0 bg-white px-5 py-5 shadow-panel" }), _jsxs("div", { className: "surface-card flex flex-col justify-between px-5 py-5", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", children: "Trend" }), _jsx("div", { className: "mt-3", children: _jsx(TrendBadge, { trend: stats.trend, label: stats.trend === "none" ? "No trend yet" : stats.trend }) })] }), _jsx("p", { className: "mt-4 text-base font-bold text-slate-950", children: stats.differenceLabel ?? "Add more entries to compare movement." })] })] })) : null, habit.type === "action" ? (_jsx(SectionCard, { title: "Recent status history", description: "The latest action check-ins, with the freshest result first.", children: logs.length ? (_jsx("div", { className: "flex flex-wrap gap-3", children: logs.slice(0, 7).map((log) => (_jsxs("div", { className: `rounded-2xl border px-4 py-3 ${log.status === "done"
                            ? "border-emerald-100 bg-emerald-50"
                            : "border-rose-100 bg-rose-50"}`, children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: formatShortDateLabel(log.date) }), _jsx("p", { className: `mt-1 text-sm font-medium ${log.status === "done"
                                    ? "text-emerald-700"
                                    : "text-rose-700"}`, children: log.status === "done" ? "Done" : "Not done" })] }, log.id))) })) : (_jsx(EmptyState, { title: "No logs yet", description: "Start logging this habit from the Today page to see recent status history here.", actionHref: "/", actionLabel: "Back to Today" })) })) : null, habit.type === "measurable" && stats && stats.type === "measurable" ? (_jsx(SectionCard, { title: "Trend snapshot", description: "A simple view of the latest movement compared with the previous entry.", children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-3xl bg-slate-50 p-5", children: [_jsx("p", { className: "text-sm font-semibold text-slate-500", children: "Latest" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-slate-950", children: stats.latestValue !== null
                                        ? formatValueWithUnit(stats.latestValue, habit.unit)
                                        : "No value yet" })] }), _jsxs("div", { className: "rounded-3xl bg-slate-50 p-5", children: [_jsx("p", { className: "text-sm font-semibold text-slate-500", children: "Change from previous" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-slate-950", children: stats.differenceLabel ?? "Add another entry" })] })] }) })) : null, _jsx(SectionCard, { title: "Recent entries", description: "The latest saved daily logs for this habit.", children: logsQuery.isLoading ? (_jsx("div", { className: "space-y-3", children: Array.from({ length: 4 }).map((_, index) => (_jsx("div", { className: "h-20 animate-pulse rounded-2xl bg-slate-100" }, index))) })) : (_jsx(RecentEntriesList, { habitType: habit.type, unit: habit.unit, logs: logs })) })] }));
};
