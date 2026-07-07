import { cn } from "../../shared/lib/utils";

type StreakFlameProps = {
  count: number;
  size?: number;
  showCount?: boolean;
  className?: string;
};

type FlameTone = {
  outer: string;
  inner: string;
  glow: string;
};

const getTone = (count: number): FlameTone => {
  if (count <= 0) {
    return { outer: "#cbd5e1", inner: "#e2e8f0", glow: "transparent" };
  }
  if (count < 7) {
    return { outer: "#fb923c", inner: "#fde047", glow: "rgba(251,146,60,0.45)" };
  }
  if (count < 30) {
    return { outer: "#f97316", inner: "#fbbf24", glow: "rgba(249,115,22,0.55)" };
  }
  // Blue-hot: the streak is on fire.
  return { outer: "#f43f5e", inner: "#fb923c", glow: "rgba(244,63,94,0.55)" };
};

/**
 * A flame that flickers and glows, sized to the streak length. The hotter
 * the streak, the more intense the color and glow.
 */
export const StreakFlame = ({
  count,
  size = 28,
  showCount = false,
  className
}: StreakFlameProps) => {
  const tone = getTone(count);
  const active = count > 0;
  const gradId = `flame-${tone.outer.replace("#", "")}`;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {active ? (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full animate-glow"
            style={{
              background: tone.glow,
              filter: "blur(6px)"
            }}
          />
        ) : null}
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={cn("relative", active && "animate-flame")}
          role="img"
          aria-label={`${count} day streak`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone.outer} />
              <stop offset="100%" stopColor={tone.inner} />
            </linearGradient>
          </defs>
          <path
            d="M12 2c1.2 3.1.3 5.2-1.3 6.9-1.6 1.7-3.7 3.3-3.7 6.4 0 3.6 2.7 6.2 6 6.2s6-2.6 6-6.2c0-2.6-1.2-4.2-2.4-5.6-.5 1-1.3 1.6-2.2 1.8 1-2.4.9-6.3-2.4-9.5Z"
            fill={`url(#${gradId})`}
          />
          {active ? (
            <path
              d="M12 12.5c1 1.4 1.6 2.6 1.6 3.9 0 1.6-1.1 2.7-2.6 2.7-1.2 0-2.1-.9-2.1-2.2 0-1.6 1.6-2.4 3.1-4.4Z"
              fill={tone.inner}
              opacity="0.9"
            />
          ) : null}
        </svg>
      </span>
      {showCount ? (
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            active ? "text-content" : "text-content-subtle"
          )}
        >
          {count}
        </span>
      ) : null}
    </span>
  );
};
