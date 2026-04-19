import { jsx as _jsx } from "react/jsx-runtime";
import { cloneElement, forwardRef } from "react";
import { cn } from "../../shared/lib/utils";
const sizeClasses = {
    sm: "h-10 px-4 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base"
};
const variantClasses = {
    primary: "bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-300",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300"
};
export const Button = forwardRef(({ asChild = false, className, variant = "primary", size = "md", children, ...props }, ref) => {
    if (asChild) {
        const child = children;
        return (cloneElement(child, {
            className: cn("inline-flex items-center justify-center rounded-2xl font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60", sizeClasses[size], variantClasses[variant], child.props.className, className)
        }));
    }
    return (_jsx("button", { ref: ref, className: cn("inline-flex items-center justify-center rounded-2xl font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60", sizeClasses[size], variantClasses[variant], className), ...props, children: children }));
});
Button.displayName = "Button";
