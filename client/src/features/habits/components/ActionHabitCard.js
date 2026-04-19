import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { StatPill } from "../../../components/ui/StatPill";
import { formatShortDateLabel } from "../../../shared/lib/date";
import { getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn } from "../../../shared/lib/utils";
import { HabitCard } from "./HabitCard";
const statusStyles = {
    done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    not_done: "bg-rose-50 text-rose-700 ring-rose-200",
    empty: "bg-slate-100 text-slate-600 ring-slate-200"
};
export const ActionHabitCard = ({ habit, isSaving, onSave }) => {
    const theme = getHabitTheme(habit.color);
    const currentStatus = habit.selectedDateLog?.status;
    const stats = habit.stats.type === "action" ? habit.stats : null;
    const badgeTone = currentStatus === "done"
        ? "done"
        : currentStatus === "not_done"
            ? "not_done"
            : "empty";
    return (_jsxs(HabitCard, { habitId: habit.id, color: habit.color, title: habit.title, label: "Action", badge: _jsx("span", { className: cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", statusStyles[badgeTone]), children: currentStatus === "done"
                ? "Done"
                : currentStatus === "not_done"
                    ? "Not done"
                    : "No log yet" }), summary: stats ? (_jsxs("div", { className: "rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100", children: [_jsx("p", { className: "text-sm font-semibold text-slate-500", children: "Current streak" }), _jsxs("p", { className: "mt-1 text-2xl font-bold text-slate-950", children: [stats.currentStreak, " day", stats.currentStreak === 1 ? "" : "s"] })] })) : null, footer: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-sm text-slate-500", children: stats?.lastCompletedDate
                        ? `Last completed ${formatShortDateLabel(stats.lastCompletedDate)}`
                        : "No completed days yet" }), _jsx(Link, { to: `/habits/${habit.id}`, className: "text-sm font-semibold text-indigo-700 transition hover:text-indigo-800", children: "View details" })] }), children: [_jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsx("button", { type: "button", onClick: () => void onSave("done"), disabled: isSaving, className: cn("flex h-14 items-center justify-center rounded-2xl border font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60", currentStatus === "done"
                            ? cn("border-transparent text-white", theme.button)
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-200"), children: isSaving && currentStatus !== "done" ? "Saving..." : "Done" }), _jsx("button", { type: "button", onClick: () => void onSave("not_done"), disabled: isSaving, className: cn("flex h-14 items-center justify-center rounded-2xl border font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60", currentStatus === "not_done"
                            ? "border-transparent bg-rose-600 text-white focus-visible:ring-rose-300"
                            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-200"), children: isSaving && currentStatus !== "not_done" ? "Saving..." : "Not done" })] }), stats ? (_jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: [_jsx(StatPill, { label: "Current streak", value: `${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}` }), _jsx(StatPill, { label: "Last completed", value: stats.lastCompletedDate
                            ? formatShortDateLabel(stats.lastCompletedDate)
                            : "No completed date" })] })) : null] }));
};
