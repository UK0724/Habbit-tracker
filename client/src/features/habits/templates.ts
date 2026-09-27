import type { HabitFormValues } from "./forms/habitFormSchema";
export const templates: Partial<HabitFormValues>[] = [
  { title: "Morning Workout", type: "action" },
  { title: "Drink 2L Water", type: "measurable", unit: "glasses", target: 8 },
  { title: "Read 15 Pages", type: "measurable", unit: "pages", target: 15 },
  { title: "Mindful Meditation", type: "action" },
  { title: "Log Daily Expenses", type: "action", linkToExpenseTracker: true },
  { title: "Sleep by 11 PM", type: "action" }
];
