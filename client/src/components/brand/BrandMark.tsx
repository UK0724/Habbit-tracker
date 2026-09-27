import { cn } from "../../shared/lib/utils";

type BrandMarkProps = {
  /** Tailwind sizing/rounding classes for the tile, e.g. "h-10 w-10 rounded-xl". */
  className?: string;
};

/**
 * Character's mark: a stylized hero crest with an embedded star core —
 * representing personal growth, character building, and everyday mastery.
 */
export const BrandMark = ({ className }: BrandMarkProps) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20",
      className
    )}
    aria-hidden
  >
    <svg viewBox="0 0 24 24" className="h-3/5 w-3/5" fill="currentColor">
      {/* Dynamic Spark / Growth Bolt */}
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  </span>
);
