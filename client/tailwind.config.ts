import type { Config } from "tailwindcss";

/** Wrap a CSS variable (space-separated RGB channels) so Tailwind's
 * opacity modifiers (e.g. `bg-surface/80`) keep working. */
const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Neutral surfaces + text driven by theme tokens
        shell: withAlpha("--bg"),
        surface: withAlpha("--surface"),
        "surface-2": withAlpha("--surface-2"),
        "surface-3": withAlpha("--surface-3"),
        "border-app": withAlpha("--border"),
        content: {
          DEFAULT: withAlpha("--text"),
          2: withAlpha("--text-2"),
          muted: withAlpha("--text-muted"),
          subtle: withAlpha("--text-subtle")
        },
        // Accent (user-selectable in Settings). `soft` uses a fixed low alpha
        // so it reads correctly on both light and dark surfaces.
        accent: {
          DEFAULT: withAlpha("--accent"),
          hover: withAlpha("--accent-hover"),
          fg: withAlpha("--accent-fg"),
          soft: "rgb(var(--accent) / 0.14)",
          strong: withAlpha("--accent-strong")
        },
        // legacy aliases kept for safety
        ink: "#111827",
        muted: "#6b7280"
      },
      boxShadow: {
        panel:
          "0 12px 40px rgba(76, 81, 191, 0.08), 0 2px 8px rgba(15, 23, 42, 0.05)"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Manrope", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
