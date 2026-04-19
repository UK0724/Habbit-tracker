import { InputHTMLAttributes, forwardRef } from "react";

import { cn } from "../../shared/lib/utils";
import { Input } from "./Input";

type NumberInputProps = InputHTMLAttributes<HTMLInputElement> & {
  unit?: string;
};

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, unit, ...props }, ref) => (
    <div className="relative">
      <Input
        ref={ref}
        type="number"
        inputMode="decimal"
        step="any"
        className={cn(unit ? "pr-20" : "", className)}
        {...props}
      />
      {unit ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {unit}
        </span>
      ) : null}
    </div>
  )
);

NumberInput.displayName = "NumberInput";
