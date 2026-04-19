import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "../../shared/lib/utils";
export const Input = forwardRef(({ className, ...props }, ref) => (_jsx("input", { ref: ref, className: cn("h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100", className), ...props })));
Input.displayName = "Input";
