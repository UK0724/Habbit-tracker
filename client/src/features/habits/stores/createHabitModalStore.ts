import { create } from "zustand";
import type { HabitFormValues } from "../forms/habitFormSchema";
import type { Habit } from "../../../shared/types/habit";

type OpenOptions = {
  /** Called once the habit has been created (after the dialog closes). */
  onSuccess?: (habit: Habit) => void;
};

interface CreateHabitModalStore {
  isOpen: boolean;
  defaultValues?: Partial<HabitFormValues>;
  onSuccess?: (habit: Habit) => void;
  open: (defaultValues?: Partial<HabitFormValues>, options?: OpenOptions) => void;
  close: () => void;
}

export const useCreateHabitModalStore = create<CreateHabitModalStore>((set) => ({
  isOpen: false,
  defaultValues: undefined,
  onSuccess: undefined,
  open: (defaultValues, options) =>
    set({ isOpen: true, defaultValues, onSuccess: options?.onSuccess }),
  close: () =>
    set({ isOpen: false, defaultValues: undefined, onSuccess: undefined })
}));
