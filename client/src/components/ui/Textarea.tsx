import { forwardRef, TextareaHTMLAttributes } from "react";

import { cn } from "../../shared/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-32 w-full rounded-2xl border border-border-app bg-surface px-4 py-3 text-content shadow-sm transition placeholder:text-content-subtle focus:border-accent/60 focus:ring-4 focus:ring-accent/30",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
