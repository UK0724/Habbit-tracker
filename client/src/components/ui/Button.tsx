import {
  ButtonHTMLAttributes,
  ElementType,
  ReactElement,
  ReactNode,
  cloneElement,
  forwardRef
} from "react";

import { cn } from "../../shared/lib/utils";

type ButtonProps<T extends ElementType = "button"> = {
  asChild?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: T;
  };

const sizeClasses = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base"
} as const;

const variantClasses = {
  primary:
    "bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-300",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-200",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-200",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300"
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      variant = "primary",
      size = "md",
      children,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      const child = children as ReactElement<{ className?: string }>;

      return (
        cloneElement(child, {
          className: cn(
            "inline-flex items-center justify-center rounded-2xl font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
            sizeClasses[size],
            variantClasses[variant],
            child.props.className,
            className
          )
        })
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-semibold transition focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
