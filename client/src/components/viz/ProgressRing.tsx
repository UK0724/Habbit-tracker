import { ReactNode, useEffect, useState } from "react";

import { useReducedMotion } from "../../shared/hooks/useReducedMotion";

type ProgressRingProps = {
  /** Progress from 0 to 1. */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  gradientToColor?: string;
  children?: ReactNode;
  className?: string;
};

/** Animated circular progress indicator with an optional gradient sweep. */
export const ProgressRing = ({
  value,
  size = 132,
  stroke = 12,
  color = "#6366f1",
  trackColor = "#eef2ff",
  gradientToColor,
  children,
  className
}: ProgressRingProps) => {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, value));
  const [progress, setProgress] = useState(reduced ? clamped : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(clamped);
      return;
    }
    const frame = requestAnimationFrame(() => setProgress(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped, reduced]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const gradientId = `ring-grad-${color.replace("#", "")}-${(gradientToColor ?? "").replace("#", "")}`;

  return (
    <div
      className={className}
      style={{ position: "relative", width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {gradientToColor ? (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={gradientToColor} />
            </linearGradient>
          </defs>
        ) : null}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradientToColor ? `url(#${gradientId})` : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: reduced
              ? undefined
              : "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)"
          }}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
};
