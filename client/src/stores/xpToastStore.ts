import { create } from "zustand";

export type ToastTone = "gain" | "loss" | "gems";

export interface XPToastItem {
  id: string;
  amount: number;
  label: string;
  title?: string;
  tone: ToastTone;
}

type ToastInput = Omit<XPToastItem, "id">;

interface XPToastStore {
  toasts: XPToastItem[];
  addToast: (toast: ToastInput) => void;
  removeToast: (id: string) => void;
}

export const useXPToastStore = create<XPToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      // Keep the stack short so bursts of rewards do not flood the screen.
      toasts: [...state.toasts.slice(-3), { ...toast, id }]
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2400);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));

export const pushToast = (toast: ToastInput) =>
  useXPToastStore.getState().addToast(toast);
