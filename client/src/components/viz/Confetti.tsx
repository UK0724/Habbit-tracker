import { useState } from "react";

import { useReducedMotion } from "../../shared/hooks/useReducedMotion";

type ConfettiProps = {
  pieceCount?: number;
};

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#3b82f6",
  "#fde047"
];

/**
 * A one-shot confetti burst. Mount it to celebrate (e.g. all habits logged
 * for the day) and unmount after ~2.5s. Renders nothing if reduced motion
 * is preferred.
 */
export const Confetti = ({ pieceCount = 90 }: ConfettiProps) => {
  const reduced = useReducedMotion();

  const [pieces] = useState(() =>
    Array.from({ length: pieceCount }).map((_, index) => {
      const left = Math.random() * 100;
      const drift = (Math.random() - 0.5) * 240;
      const rotate = 360 + Math.random() * 720;
      const delay = Math.random() * 0.4;
      const duration = 1.8 + Math.random() * 1.4;
      const size = 6 + Math.random() * 7;
      const color = COLORS[index % COLORS.length];
      const round = Math.random() > 0.5;
      return { left, drift, rotate, delay, duration, size, color, round };
    })
  );

  if (reduced) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="absolute top-0"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * (piece.round ? 1 : 1.6),
            background: piece.color,
            borderRadius: piece.round ? "9999px" : "2px",
            // custom props consumed by the confetti-fall keyframe
            ["--confetti-x" as string]: `${piece.drift}px`,
            ["--confetti-r" as string]: `${piece.rotate}deg`,
            animation: `confetti-fall ${piece.duration}s cubic-bezier(0.4, 0.6, 0.5, 1) ${piece.delay}s forwards`
          }}
        />
      ))}
    </div>
  );
};
