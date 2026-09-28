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
  /** Primary-coloured text on dark surfaces (AA on background/card). */
  primaryText: "#818CF8",

  success: "#10B981",
  successLight: "rgba(16, 185, 129, 0.15)",
  successBorder: "rgba(16, 185, 129, 0.4)",
  /** Label colour on solid success backgrounds (white fails contrast there). */
  onSuccess: "#04291C",

  warning: "#F59E0B",
  warningLight: "rgba(245, 158, 11, 0.15)",

  danger: "#EF4444",
  dangerLight: "rgba(239, 68, 68, 0.15)",
  dangerBorder: "rgba(239, 68, 68, 0.3)",
  dangerText: "#F87171",

  // Single source for reward colours.
  gem: "#38BDF8",
  gemLight: "rgba(56, 189, 248, 0.15)",
  gemBorder: "rgba(56, 189, 248, 0.4)",

  /** Streak freezes and repaired ("frozen") days: icy cyan. */
  frozen: "#67E8F9",
  frozenLight: "rgba(103, 232, 249, 0.14)",
  frozenBorder: "rgba(103, 232, 249, 0.45)",

  xp: "#8B5CF6",
  xpLight: "rgba(139, 92, 246, 0.15)",
  xpBorder: "rgba(139, 92, 246, 0.4)",
  /** XP-coloured text on dark surfaces. */
  xpText: "#A78BFA",

  streak: "#FB923C",
  streakLight: "rgba(249, 115, 22, 0.15)",
  streakBorder: "rgba(249, 115, 22, 0.4)",

  gold: "#FBBF24",
  goldLight: "rgba(251, 191, 36, 0.12)",
  goldBorder: "rgba(251, 191, 36, 0.4)",

  text: "#F8FAFC",
  textSecondary: "#A9B6CA",
  textMuted: "#8A9AB3",

  overlay: "rgba(5, 8, 15, 0.88)",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent"
};

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export const TIER_COLORS: Record<Tier, { fg: string; bg: string; border: string }> = {
  bronze: { fg: "#F0A45D", bg: "rgba(217, 119, 6, 0.16)", border: "#D97706" },
  silver: { fg: "#CBD5E1", bg: "rgba(148, 163, 184, 0.16)", border: "#94A3B8" },
  gold: { fg: "#FBBF24", bg: "rgba(251, 191, 36, 0.16)", border: "#F59E0B" },
  platinum: { fg: "#D8B4FE", bg: "rgba(192, 132, 252, 0.18)", border: "#C084FC" }
};

export const tierColors = (tier?: string | null) =>
  TIER_COLORS[(tier as Tier) in TIER_COLORS ? (tier as Tier) : "bronze"];

/** Level tiers: bronze < 10, silver 10–24, gold 25–49, platinum 50+ (100 is max). */
export const levelTier = (level: number): Tier =>
  level >= 50 ? "platinum" : level >= 25 ? "gold" : level >= 10 ? "silver" : "bronze";

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

/** Minimum touch target (dp). */
export const TOUCH_TARGET = 44;

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
  label: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: COLORS.textSecondary
  },
  micro: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: COLORS.textMuted
  },
  badge: {
    fontSize: 11,
    fontWeight: "700" as const
  }
};
