export type HabitType = "action" | "measurable" | "expense";
export type ActionStatus = "done" | "not_done";
export type Trend = "up" | "down" | "same" | "none";

export type ApiResponse<T> = {
  data: T;
};

export type Habit = {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  requireCompletionComment: boolean;
  color: string;
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
};

export type HabitListItem = Habit & {
  selectedDateLog: HabitLog | null;
  stats: HabitStats;
  recentDays: RecentDay[];
};

export type TodayLogEntry = HabitLog & {
  habit: Habit | null;
};

export type CreateHabitInput = {
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  requireCompletionComment?: boolean;
  color: string;
};

export type UpdateHabitInput = Partial<CreateHabitInput>;

export type SaveHabitLogInput = {
  date: string;
  status?: ActionStatus | null;
  value?: number | null;
  comment?: string;
};
