import { create } from "zustand";
import type { HabitFormValues } from "../forms/habitFormSchema";

interface CreateHabitModalStore {
  isOpen: boolean;
  defaultValues?: Partial<HabitFormValues>;
  open: (defaultValues?: Partial<HabitFormValues>) => void;
  close: () => void;
}

export const useCreateHabitModalStore = create<CreateHabitModalStore>((set) => ({
  isOpen: false,
  defaultValues: undefined,
  open: (defaultValues) => set({ isOpen: true, defaultValues }),
  close: () => set({ isOpen: false, defaultValues: undefined })
}));
