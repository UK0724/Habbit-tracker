import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "../../shared/hooks/useReducedMotion";

type CountUpProps = {
  value: number;
  durationMs?: number;
  decimals?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Animates a number from its previous value up to `value` on change. */
export const CountUp = ({
  value,
  durationMs = 900,
  decimals = 0,
  className,
  suffix,
  prefix
}: CountUpProps) => {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const fromRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(progress);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      fromRef.current = value;
    };
  }, [value, durationMs, reduced]);

  const formatted = display.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
