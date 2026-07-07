import { useId } from "react";

import { cn } from "../../shared/lib/utils";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  showArea?: boolean;
};

/** A compact line + area chart for measurable habit trends. */
export const Sparkline = ({
  data,
  width = 320,
  height = 96,
  color = "#6366f1",
  className,
  showArea = true
}: SparklineProps) => {
  const gradientId = useId();

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-surface-2 text-xs font-medium text-content-subtle",
          className
        )}
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const pad = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const points = data.map((value, index) => {
    const x = data.length > 1 ? pad + index * stepX : width / 2;
    const y = pad + (1 - (value - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const first = points[0]!;
  const last = points[points.length - 1]!;

  const areaPath = `${linePath} L${last.x},${height - pad} L${first.x},${height - pad} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && points.length > 1 ? (
        <path d={areaPath} fill={`url(#${gradientId})`} />
      ) : null}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r={4} fill={color} />
      <circle cx={last.x} cy={last.y} r={7} fill={color} opacity={0.2}>
        <animate
          attributeName="r"
          values="4;9;4"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.25;0;0.25"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};
