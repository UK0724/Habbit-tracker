import { create } from "zustand";
import { addDaysToDateString, getTodayDateString } from "../../../shared/lib/date";
export const useHomeDateStore = create((set) => ({
    selectedDate: getTodayDateString(),
    setSelectedDate: (selectedDate) => set({ selectedDate }),
    shiftSelectedDate: (amount) => set((state) => ({
        selectedDate: addDaysToDateString(state.selectedDate, amount)
    })),
    resetSelectedDate: () => set({ selectedDate: getTodayDateString() })
}));
