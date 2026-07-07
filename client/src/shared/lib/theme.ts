export type ThemeMode = "light" | "dark" | "system";
export type AccentName =
  | "indigo"
  | "violet"
  | "blue"
  | "teal"
  | "emerald"
  | "amber"
  | "rose";

export type AccentPreset = {
  name: AccentName;
  label: string;
  /** Solid hex mirror of the accent, for SVG-based viz (rings, sparklines). */
  hex: string;
};

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: "indigo", label: "Indigo", hex: "#6366f1" },
  { name: "violet", label: "Violet", hex: "#8b5cf6" },
  { name: "blue", label: "Blue", hex: "#3b82f6" },
  { name: "teal", label: "Teal", hex: "#14b8a6" },
  { name: "emerald", label: "Emerald", hex: "#10b981" },
  { name: "amber", label: "Amber", hex: "#f59e0b" },
  { name: "rose", label: "Rose", hex: "#f43f5e" }
];

export const accentHex = (name: AccentName): string =>
  ACCENT_PRESETS.find((preset) => preset.name === name)?.hex ?? "#6366f1";

export const THEME_STORAGE_KEY = "habit-theme";

export const resolveMode = (mode: ThemeMode): "light" | "dark" => {
  if (mode === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }
  return mode;
};

/** Apply the resolved theme + accent to <html>. Safe to call repeatedly. */
export const applyTheme = (mode: ThemeMode, accent: AccentName) => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.setAttribute("data-theme", resolveMode(mode));
  root.setAttribute("data-accent", accent);
};
