export const habitThemes = {
  violet: {
    accent: "bg-violet-500",
    soft: "bg-violet-50 text-violet-700 ring-violet-200",
    tint: "from-violet-500/15 via-violet-100/40 to-transparent",
    button: "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-300"
  },
  indigo: {
    accent: "bg-indigo-500",
    soft: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    tint: "from-indigo-500/15 via-indigo-100/40 to-transparent",
    button: "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-300"
  },
  blue: {
    accent: "bg-blue-500",
    soft: "bg-blue-50 text-blue-700 ring-blue-200",
    tint: "from-blue-500/15 via-blue-100/40 to-transparent",
    button: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-300"
  },
  emerald: {
    accent: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    tint: "from-emerald-500/15 via-emerald-100/40 to-transparent",
    button: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300"
  },
  rose: {
    accent: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700 ring-rose-200",
    tint: "from-rose-500/15 via-rose-100/40 to-transparent",
    button: "bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-300"
  },
  amber: {
    accent: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700 ring-amber-200",
    tint: "from-amber-500/15 via-amber-100/40 to-transparent",
    button: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300"
  },
  slate: {
    accent: "bg-slate-500",
    soft: "bg-slate-100 text-slate-700 ring-slate-200",
    tint: "from-slate-500/15 via-slate-100/40 to-transparent",
    button: "bg-slate-700 hover:bg-slate-800 focus-visible:ring-slate-300"
  }
} as const;

export type HabitThemeName = keyof typeof habitThemes;

export const getHabitTheme = (color: string) =>
  habitThemes[color as HabitThemeName] ?? habitThemes.indigo;

/**
 * Raw hex values for SVG-based visualizations (rings, sparklines, heatmaps)
 * where Tailwind utility classes cannot be applied to `fill`/`stroke`.
 * `base` mirrors the *-500 accent, `soft` the *-100 wash, `ink` a darker
 * *-700 for legible text on soft backgrounds.
 */
export const habitHexThemes = {
  violet: { base: "#8b5cf6", soft: "#ede9fe", ink: "#6d28d9" },
  indigo: { base: "#6366f1", soft: "#e0e7ff", ink: "#4338ca" },
  blue: { base: "#3b82f6", soft: "#dbeafe", ink: "#1d4ed8" },
  emerald: { base: "#10b981", soft: "#d1fae5", ink: "#047857" },
  rose: { base: "#f43f5e", soft: "#ffe4e6", ink: "#be123c" },
  amber: { base: "#f59e0b", soft: "#fef3c7", ink: "#b45309" },
  slate: { base: "#64748b", soft: "#f1f5f9", ink: "#334155" }
} as const;

export const getHabitHex = (color: string) =>
  habitHexThemes[color as HabitThemeName] ?? habitHexThemes.indigo;
