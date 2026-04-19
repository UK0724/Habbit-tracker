import { ReactNode } from "react";

import { cn } from "../../shared/lib/utils";

type StatPillProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export const StatPill = ({ label, value, className }: StatPillProps) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3",
      className
    )}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-base font-bold text-slate-950">{value}</p>
  </div>
);
