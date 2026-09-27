import { create } from "zustand";
import type { AchievementItem } from "../services/api";

interface AchievementState {
  currentAchievement: AchievementItem | null;
  isBannerVisible: boolean;
  mode: "unlock" | "details";
  pending: AchievementItem[];
  celebrated: string[];
  showAchievement: (achievement: AchievementItem) => void;
  viewAchievement: (achievement: AchievementItem) => void;
  dismissBanner: () => void;
  reset: () => void;
}

const initial = {
  currentAchievement: null,
  isBannerVisible: false,
  mode: "unlock" as const,
  pending: [] as AchievementItem[],
  celebrated: [] as string[]
};

export const useAchievementStore = create<AchievementState>((set) => ({
  ...initial,
  showAchievement: (achievement) => set((state) => {
    if (!achievement.unlocked || state.celebrated.includes(achievement.id)) return state;
    const celebrated = [...state.celebrated, achievement.id];
    if (state.isBannerVisible) return { celebrated, pending: [...state.pending, achievement] };
    return { celebrated, currentAchievement: achievement, isBannerVisible: true, mode: "unlock" };
  }),
  viewAchievement: (achievement) => set((state) => {
    if (state.isBannerVisible || !achievement.unlocked) return state;
    return { currentAchievement: achievement, isBannerVisible: true, mode: "details" };
  }),
  dismissBanner: () => set((state) => ({
    currentAchievement: state.pending[0] ?? null,
    pending: state.pending.slice(1),
    isBannerVisible: state.pending.length > 0,
    mode: "unlock"
  })),
  reset: () => set(initial)
}));
