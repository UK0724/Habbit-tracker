import { create } from "zustand";

import {
  addDaysToDateString,
  getTodayDateString
} from "../../../shared/lib/date";

type HomeDateState = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  shiftSelectedDate: (amount: number) => void;
  resetSelectedDate: () => void;
};

export const useHomeDateStore = create<HomeDateState>((set) => ({
  selectedDate: getTodayDateString(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  shiftSelectedDate: (amount) =>
    set((state) => ({
      selectedDate: addDaysToDateString(state.selectedDate, amount)
    })),
  resetSelectedDate: () => set({ selectedDate: getTodayDateString() })
}));
