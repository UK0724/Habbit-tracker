import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../shared/lib/utils";
export const StatPill = ({ label, value, className }) => (_jsxs("div", { className: cn("rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3", className), children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500", children: label }), _jsx("p", { className: "mt-2 text-base font-bold text-slate-950", children: value })] }));
