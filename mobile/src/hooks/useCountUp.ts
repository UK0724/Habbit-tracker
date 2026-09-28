import { useEffect, useRef, useState } from "react";

/**
 * Animates a displayed number toward `value` (ease-out). The first value is
 * shown immediately; later changes count up/down over `duration` ms.
 */
export const useCountUp = (value: number | null | undefined, duration = 700) => {
  const [display, setDisplay] = useState<number | null>(value ?? null);
  const shown = useRef<number | null>(value ?? null);

  useEffect(() => {
    if (value == null) return;
    const from = shown.current;
    if (from == null || from === value) {
      shown.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    const started = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (value - from) * eased);
      shown.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
};
