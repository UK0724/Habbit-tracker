import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { cn } from "../../shared/lib/utils";
import { Input } from "./Input";
export const NumberInput = forwardRef(({ className, unit, ...props }, ref) => (_jsxs("div", { className: "relative", children: [_jsx(Input, { ref: ref, type: "number", inputMode: "decimal", step: "any", className: cn(unit ? "pr-20" : "", className), ...props }), unit ? (_jsx("span", { className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600", children: unit })) : null] })));
NumberInput.displayName = "NumberInput";
