import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { getHabitTheme } from "../../../shared/lib/habitTheme";
import { cn } from "../../../shared/lib/utils";
export const HabitCard = ({ habitId, color, title, label, badge, summary, children, footer }) => {
    const theme = getHabitTheme(color);
    return (_jsxs("article", { className: "surface-card relative overflow-hidden p-5 sm:p-6", children: [_jsx("div", { className: cn("absolute inset-x-0 top-0 h-1.5", theme.accent) }), _jsx("div", { className: cn("pointer-events-none absolute inset-0 bg-gradient-to-br", theme.tint) }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1", theme.soft), children: label }), badge] }), _jsx(Link, { to: `/habits/${habitId}`, className: "mt-3 inline-block font-display text-2xl font-bold tracking-tight text-slate-950 transition hover:text-indigo-700", children: title })] }), summary ? _jsx("div", { className: "sm:max-w-xs", children: summary }) : null] }), _jsx("div", { className: "mt-6", children: children }), footer ? (_jsx("div", { className: "mt-6 border-t border-slate-100 pt-4", children: footer })) : null] })] }));
};
