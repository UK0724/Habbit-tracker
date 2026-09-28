import type { Rules } from "../lib/rules";
export type HabitType = "action" | "measurable" | "expense";
export type ActionStatus = "done" | "not_done" | "skipped";
export type Trend = "up" | "down" | "same" | "none";
export type GoalDirection = "up" | "down" | "range" | "record";

export type ApiResponse<T> = {
  data: T;
};

/** Offered when a recent missed day broke a running streak and can be excused. */
export type StreakRepairOffer = {
  date: string;
  freezeCost: number;
  gemCost: number;
};

export type Habit = {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  requireCompletionComment: boolean;
  color: string;
  archived: boolean;
  linkToExpenseTracker?: boolean;
  goalDirection: GoalDirection;
  target?: number | null;
  schedule?: "daily" | "weekdays" | "weekly";
  weekdays?: number[];
  timesPerWeek?: number;
  targetMax?: number | null;
  reminderTime?: string;
  ruleHistory?: (Rules & { effectiveDate: string })[];

  /** Creation day in the user's timezone (YYYY-MM-DD). */
  startDate?: string;
  /** List items and habit detail only (absent on older servers). */
  streakRepair?: StreakRepairOffer | null;
  createdAt: string;
  updatedAt: string;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  status: ActionStatus | null;
  value: number | null;
  comment?: string;
  /** A missed day excused by a streak repair (status is "skipped"). */
  frozen?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActionHabitStats = {
  type: "action";
  currentStreak: number;
  lastCompletedDate: string | null;
};

export type MeasurableHabitStats = {
  type: "measurable";
  latestValue: number | null;
  previousValue: number | null;
  trend: Trend;
  difference: number | null;
  differenceLabel: string | null;
};

export type HabitStats = ActionHabitStats | MeasurableHabitStats;

export type RecentDay = {
  date: string;
  status: ActionStatus | null;
  value: number | null;
  hasLog: boolean;
  /** Excused by a streak repair. */
  frozen?: boolean;
};

export type HabitListItem = Habit & {
  selectedDateLog: HabitLog | null;
  stats: HabitStats;
  recentDays: RecentDay[];
};


export type CreateHabitInput = {
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  requireCompletionComment?: boolean;
  linkToExpenseTracker?: boolean;
  color: string;
  goalDirection?: GoalDirection;
  target?: number | null;
  schedule?: "daily" | "weekdays" | "weekly";
  weekdays?: number[];
  timesPerWeek?: number;
  targetMax?: number | null;
  reminderTime?: string;
  ruleHistory?: (Rules & { effectiveDate: string })[];

};

export type UpdateHabitInput = Partial<CreateHabitInput>;

export type SaveHabitLogInput = {
  date: string;
  status?: ActionStatus | null;
  value?: number | null;
  comment?: string;
};
