import { cn } from "../../shared/lib/utils";

type BrandMarkProps = {
  /** Tailwind sizing/rounding classes for the tile, e.g. "h-10 w-10 rounded-xl". */
  className?: string;
};

/**
 * Pulse's mark: a check whose tail rises into growth, ending in an amber
 * streak dot. Same geometry as mobile/scripts/generate-brand.cjs.
 */
export const BrandMark = ({ className }: BrandMarkProps) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20",
      className
    )}
    aria-hidden
  >
    <svg viewBox="0 0 64 64" className="h-4/5 w-4/5">
      <polyline
        points="14,34 25,45 36,30 42,36 51,19"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="51" cy="19" r="4.5" fill="#fbbf24" />
    </svg>
  </span>
);
