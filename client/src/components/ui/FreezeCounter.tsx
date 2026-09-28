import { cn } from "../../shared/lib/utils";

/** Streak freezes in stock: each covers one missed check-in or repairs a habit streak. */
export const FreezeCounter = ({
  freezes,
  className
}: {
  freezes: number;
  className?: string;
}) => (
  <span
    title={`${freezes} streak ${freezes === 1 ? "freeze" : "freezes"}`}
    aria-label={`${freezes} streak ${freezes === 1 ? "freeze" : "freezes"}`}
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-xs font-extrabold text-cyan-700 shadow-sm dark:text-cyan-300",
      className
    )}
  >
    <span aria-hidden className="text-base leading-none">
      🛡️
    </span>
    <span aria-hidden>{freezes.toLocaleString()}</span>
  </span>
);
