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

// You can't track the future — never let the selected date go past today.
const clampToToday = (date: string) => {
  const today = getTodayDateString();
  return date > today ? today : date;
};

export const useHomeDateStore = create<HomeDateState>((set) => ({
  selectedDate: getTodayDateString(),
  setSelectedDate: (selectedDate) =>
    set({ selectedDate: clampToToday(selectedDate) }),
  shiftSelectedDate: (amount) =>
    set((state) => ({
      selectedDate: clampToToday(addDaysToDateString(state.selectedDate, amount))
    })),
  resetSelectedDate: () => set({ selectedDate: getTodayDateString() })
}));
