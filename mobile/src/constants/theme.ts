export const COLORS = {
  background: "#0B0F19",
  surface: "#131B2E",
  surfaceElevated: "#1E293B",
  card: "#162238",
  cardHover: "#1E2C48",
  border: "#24324D",
  borderLight: "#334566",

  primary: "#6366F1",
  primaryHover: "#4F46E5",
  primaryLight: "rgba(99, 102, 241, 0.15)",

  success: "#10B981",
  successLight: "rgba(16, 185, 129, 0.15)",

  warning: "#F59E0B",
  warningLight: "rgba(245, 158, 11, 0.15)",

  danger: "#EF4444",
  dangerLight: "rgba(239, 68, 68, 0.15)",

  gem: "#06B6D4",
  gemLight: "rgba(6, 182, 212, 0.15)",

  xp: "#8B5CF6",
  xpLight: "rgba(139, 92, 246, 0.15)",

  streak: "#F97316",
  streakLight: "rgba(249, 115, 22, 0.15)",

  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",

  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent"
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999
};

export const TYPOGRAPHY = {
  hero: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: COLORS.text
  },
  title1: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: COLORS.text
  },
  title2: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text
  },
  title3: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: COLORS.text
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: COLORS.textSecondary
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: COLORS.textMuted
  },
  badge: {
    fontSize: 11,
    fontWeight: "700" as const
  }
};
