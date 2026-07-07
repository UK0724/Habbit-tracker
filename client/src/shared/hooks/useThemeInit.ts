import { useEffect } from "react";

import { applyTheme } from "../lib/theme";
import { useThemeStore } from "../../stores/themeStore";

/**
 * Keeps the DOM theme in sync with the store and reacts to OS theme changes
 * while in "system" mode. Mount once near the app root.
 */
export const useThemeInit = () => {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);

  useEffect(() => {
    applyTheme(mode, accent);
  }, [mode, accent]);

  useEffect(() => {
    if (mode !== "system" || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system", accent);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode, accent]);
};
