import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  AccentName,
  ThemeMode,
  THEME_STORAGE_KEY,
  applyTheme
} from "../shared/lib/theme";

type ThemeState = {
  mode: ThemeMode;
  accent: AccentName;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentName) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "system",
      accent: "indigo",
      setMode: (mode) => {
        set({ mode });
        applyTheme(mode, get().accent);
      },
      setAccent: (accent) => {
        set({ accent });
        applyTheme(get().mode, accent);
      }
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.mode, state.accent);
        }
      }
    }
  )
);
