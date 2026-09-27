import { forwardRef, InputHTMLAttributes } from "react";

import { cn } from "../../shared/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full max-w-full min-w-0 box-border rounded-2xl border border-border-app bg-surface px-4 text-content shadow-sm transition placeholder:text-content-subtle focus:border-accent/60 focus:ring-4 focus:ring-accent/30",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
