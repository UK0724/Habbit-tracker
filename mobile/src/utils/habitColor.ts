import { COLORS } from "../constants/theme";

// The web form stores palette names; the native form stores hex values.
const HABIT_COLORS: Record<string, string> = {
  violet: "#8B5CF6",
  indigo: "#6366F1",
  blue: "#3B82F6",
  emerald: "#10B981",
  rose: "#F43F5E",
  amber: "#F59E0B",
  slate: "#64748B"
};

export const habitColor = (value?: string | null): string => {
  const color = value?.trim().toLowerCase();
  if (!color) return COLORS.primary;
  if (HABIT_COLORS[color]) return HABIT_COLORS[color];
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return color;
  return COLORS.primary;
};
