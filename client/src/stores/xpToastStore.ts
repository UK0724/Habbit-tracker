import { create } from "zustand";
interface XPToastItem {
  id: string;
  amount: number;
  label?: string;
  title?: string;
  x?: number;
  y?: number;
}

interface XPToastStore {
  toasts: XPToastItem[];
  addToast: (
    amount: number,
    label?: string,
    x?: number,
    y?: number,
    title?: string
  ) => void;
  removeToast: (id: string) => void;
}

export const useXPToastStore = create<XPToastStore>((set) => ({
  toasts: [],
  addToast: (amount, label = "XP", x, y, title) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, amount, label, x, y, title }]
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));

export const triggerXPToast = (
  amount: number,
  label: string = "XP",
  x?: number,
  y?: number,
  title?: string
) => {
  useXPToastStore.getState().addToast(amount, label, x, y, title);
};

