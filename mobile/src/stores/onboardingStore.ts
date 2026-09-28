import { create } from "zustand";

/**
 * The "How Pulse works" walkthrough. `requested` means someone asked for it
 * (first run or a replay); WalkthroughHost decides when it can actually show
 * (never over a celebration modal).
 */
interface OnboardingState {
  requested: boolean;
  /** Bumped on every open, so a replay always restarts at step 1. */
  openId: number;
  /** User ids that saw it this app session (fallback when storage fails). */
  sessionSeen: string[];
  open: () => void;
  close: () => void;
  markSessionSeen: (userId: string) => void;
  /** Sign-out / account switch: close without forgetting the session list. */
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  requested: false,
  openId: 0,
  sessionSeen: [],
  open: () => set((state) => ({ requested: true, openId: state.openId + 1 })),
  close: () => set({ requested: false }),
  markSessionSeen: (userId) =>
    set((state) =>
      state.sessionSeen.includes(userId) ? state : { sessionSeen: [...state.sessionSeen, userId] }
    ),
  reset: () => set({ requested: false })
}));

/** Opens the walkthrough at step 1 (Profile "How Pulse works", Today empty state). */
export const openWalkthrough = () => useOnboardingStore.getState().open();
