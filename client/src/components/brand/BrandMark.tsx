import { cn } from "../../shared/lib/utils";

type BrandMarkProps = {
  /** Tailwind sizing/rounding classes for the tile, e.g. "h-10 w-10 rounded-xl". */
  className?: string;
};

/**
 * Arc's mark: a curve arcing upward to a target dot — progress trending up,
 * day after day. Rendered in accent-fg on the accent tile.
 */
export const BrandMark = ({ className }: BrandMarkProps) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm",
      className
    )}
    aria-hidden
  >
    <svg
      viewBox="0 0 24 24"
      className="h-3/5 w-3/5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 17.5C8 17 11 13.5 12.5 9.5C13.5 6.8 15.8 5.5 19 5.5" />
      <circle cx="19" cy="5.5" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  </span>
);
