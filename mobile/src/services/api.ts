import { getApiBaseUrl } from "../constants/config";
import { useAuthStore } from "../stores/authStore";
import type {
  ApiResponse,
  HabitListItem,
  Habit,
  CreateHabitInput,
  UpdateHabitInput,
  HabitLog,
  TodayLogEntry,
  SaveHabitLogInput,
  HabitStats,
  RecentDay
} from "@habit-tracker/shared";

export const OFFLINE_MESSAGE =
  "Can't reach Pulse. Check your connection and try again.";

const fetchWithTimeout = async (
  url: string,
  options: RequestInit
): Promise<Response> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener("abort", abort);
  const timeout = setTimeout(abort, 15000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
};

export type ApiErrorCode = "NETWORK" | "SESSION_CHANGED" | "INVALID_RESPONSE" | "HTTP";

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;
  public readonly code: ApiErrorCode;

  constructor(message: string, status: number, details?: unknown, code: ApiErrorCode = "HTTP") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

/** A user-facing message for any thrown value. */
export const errorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") =>
  error instanceof Error && error.message ? error.message : fallback;

// ── Gamification types (see Pulse 1.1.0 API contract) ──
export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";
export type AchievementCategory =
  | "beginner"
  | "streak"
  | "performance"
  | "consistency"
  | "levels"
  | "special";

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  xpBonus: number;
  /** Optional so older servers keep working. */
  gemBonus?: number;
  tier: AchievementTier;
  category?: AchievementCategory;
}

export interface AchievementItem extends Achievement {
  /** Present on /achievements; reward payloads omit it (they are unlocked). */
  unlocked?: boolean;
  unlockedAt?: string | null;
}

export interface CheckinResult {
  alreadyCheckedIn: boolean;
  streak: number;
  longestStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  xpAwarded: number;
  previousStreak?: number;
  canRestore?: boolean;
  restoreCost?: number;
  restoreExpiresAt?: string | null;
  /** No active habit yet: nothing was recorded (the streak starts with the first habit). */
  needsHabit?: boolean;
}

// ── Habit streak repair (Pulse 1.1.0 addendum) ──
export interface StreakRepairOffer {
  /** The missed day (YYYY-MM-DD) that broke a running streak. */
  date: string;
  freezeCost: number;
  gemCost: number;
}

/** Offered on habit list items and habit detail; absent on older servers. */
export type WithStreakRepair = { streakRepair?: StreakRepairOffer | null };
/** Repaired days: skipped logs excused by a streak repair. */
export type FrozenFlag = { frozen?: boolean };

export type PulseHabit = Habit & WithStreakRepair;
export type PulseRecentDay = RecentDay & FrozenFlag;
export type PulseHabitListItem = HabitListItem &
  WithStreakRepair & { recentDays: PulseRecentDay[] };
export type PulseHabitLog = HabitLog & FrozenFlag;

export type StreakRepairResult = RewardSummary & {
  paidWith: "freeze" | "gems";
  date: string;
  streakFreezes: number;
  gems: number;
};

export interface RewardSummary {
  xpAwarded: number;
  newAchievements: Achievement[];
  levelUp: { level: number; title: string } | null;
  gemsAwarded: number;
  legendaryDay?: boolean;
  checkin?: CheckinResult | null;
}

export interface GamificationProfile {
  userId: string;
  totalXP: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  /** null at max level. */
  xpNeeded: number | null;
  gems: number;
  loginStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  streakFreezes: number;
  achievementCount: number;
  achievementTotal?: number;
  brokenStreak?: { previousStreak: number; restoreExpiresAt: string | null } | null;
  today: string;
}

/** Kept for existing imports. */
export type DailyCheckinResult = CheckinResult & Partial<RewardSummary>;

export type RewardedLog = HabitLog & { reward?: RewardSummary | null };

const buildHeaders = async (init?: RequestInit): Promise<Headers> => {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = useAuthStore.getState().token;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
};

export const apiRequest = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const sessionToken = useAuthStore.getState().token;
  let baseUrl: string;
  try {
    baseUrl = await getApiBaseUrl();
  } catch (error) {
    console.error("[api] API URL unavailable", error);
    throw new ApiError(OFFLINE_MESSAGE, 0, error, "NETWORK");
  }
  const headers = await buildHeaders(init);

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      ...init,
      headers
    });
  } catch (error: unknown) {
    // Keep the raw cause for debugging; users get plain words.
    console.error(`[api] ${init?.method ?? "GET"} ${path} failed`, error);
    throw new ApiError(OFFLINE_MESSAGE, 0, error, "NETWORK");
  }

  if (sessionToken !== useAuthStore.getState().token)
    throw new ApiError("You were signed out. Please try again.", 409, undefined, "SESSION_CHANGED");

  const contentType = response.headers.get("content-type");
  const hasJson = contentType?.includes("application/json");
  let payload: ApiResponse<T> | null = null;
  if (hasJson) {
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch (error) {
      console.error(`[api] ${path} returned malformed JSON`, error);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      await useAuthStore.getState().clearAuth().catch(() => undefined);
    }

    const serverMessage =
      payload && typeof (payload as { message?: string }).message === "string"
        ? (payload as { message?: string }).message
        : null;
    const message =
      serverMessage ||
      (response.status >= 500
        ? "Pulse is having trouble right now. Please try again in a moment."
        : "That didn't work. Please try again.");

    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    console.error(`[api] ${path} returned an unexpected body`);
    throw new ApiError(OFFLINE_MESSAGE, 502, undefined, "INVALID_RESPONSE");
  }
  return payload.data;
};

// ── Auth API ──
export const authApi = {
  login: async (body: {
    email: string;
    password: string;
    timezone?: string;
  }) => {
    return apiRequest<{ token: string; user: { id: string; email: string } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );
  },

  register: async (body: {
    email: string;
    password: string;
    timezone?: string;
  }) => {
    return apiRequest<{ token: string; user: { id: string; email: string } }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );
  },

  forgotPassword: async (email: string) => {
    return apiRequest<{ sent: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },

  getMe: async () => {
    return apiRequest<{ id: string; email: string }>("/auth/me");
  },

  deleteAccount: async (password: string) => {
    return apiRequest<void>("/account", {
      method: "DELETE",
      body: JSON.stringify({ password })
    });
  }
};

// ── Habit API ──
export const habitApi = {
  list: async (params?: { date?: string; includeArchived?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.includeArchived) query.set("includeArchived", "true");
    const qs = query.toString();
    return apiRequest<PulseHabitListItem[]>(`/habits${qs ? `?${qs}` : ""}`);
  },

  get: async (id: string) => {
    return apiRequest<PulseHabit>(`/habits/${id}`);
  },

  getStats: async (id: string) => {
    return apiRequest<HabitStats>(`/habits/${id}/stats`);
  },

  create: async (data: CreateHabitInput) => {
    return apiRequest<Habit>("/habits", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  update: async (id: string, data: UpdateHabitInput) => {
    return apiRequest<Habit>(`/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  },

  archive: async (id: string, archived: boolean) => {
    return apiRequest<Habit>(`/habits/${id}/archive`, {
      method: "PATCH",
      body: JSON.stringify({ archived })
    });
  },

  delete: async (id: string) => {
    return apiRequest<void>(`/habits/${id}`, {
      method: "DELETE"
    });
  },

  /** Spends 1 streak freeze (or gems) to excuse the offered missed day. */
  repairStreak: async (id: string, date: string) => {
    return apiRequest<StreakRepairResult>(`/habits/${id}/streak-repair`, {
      method: "POST",
      body: JSON.stringify({ date })
    });
  }
};

// ── Habit Logs API ──
export const habitLogApi = {
  getTodayLogs: async () => {
    return apiRequest<TodayLogEntry[]>("/logs/today");
  },

  list: async (habitId: string, limit = 30) => {
    return apiRequest<PulseHabitLog[]>(`/habits/${habitId}/logs?limit=${limit}`);
  },

  create: async (habitId: string, payload: SaveHabitLogInput) => {
    return apiRequest<RewardedLog>(`/habits/${habitId}/logs`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  update: async (
    habitId: string,
    logId: string,
    payload: SaveHabitLogInput
  ) => {
    return apiRequest<RewardedLog>(`/habits/${habitId}/logs/${logId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  /** Undo/unskip. Older servers answer 204 (undefined). */
  delete: async (habitId: string, logId: string) => {
    const result = await apiRequest<{ reward: RewardSummary | null } | undefined>(
      `/habits/${habitId}/logs/${logId}`,
      { method: "DELETE" }
    );
    return { reward: result?.reward ?? null };
  }
};

// ── Gamification API ──
export const gamificationApi = {
  getProfile: async () => {
    return apiRequest<GamificationProfile>("/gamification/profile");
  },

  getAchievements: async () => {
    return apiRequest<AchievementItem[]>("/gamification/achievements");
  },

  dailyCheckin: async () => {
    return apiRequest<CheckinResult & Partial<RewardSummary>>("/gamification/checkin", {
      method: "POST"
    });
  },

  useStreakFreeze: async () => {
    return apiRequest<{ gems: number; streakFreezes: number } & Partial<RewardSummary>>(
      "/gamification/freeze",
      { method: "POST" }
    );
  },

  /** Spends gems to restore a recently broken check-in streak. */
  restoreStreak: async () => {
    return apiRequest<{ streak: number; gems: number } & Partial<RewardSummary>>(
      "/gamification/restore-streak",
      { method: "POST" }
    );
  },

  /** Call after the OS share sheet reports a share. */
  share: async () => {
    return apiRequest<RewardSummary | null>("/gamification/share", {
      method: "POST"
    });
  }
};

// ── Account API ──
export const accountApi = {
  /** The profile photo as a data URL, or null. */
  getAvatar: async () => {
    return apiRequest<{ avatar: string | null }>("/account/avatar");
  },

  /** `image` is a data URL (jpeg/png/webp, decoded <= 64 KB). */
  setAvatar: async (image: string) => {
    return apiRequest<{ avatar: string | null }>("/account/avatar", {
      method: "PUT",
      body: JSON.stringify({ image })
    });
  },

  removeAvatar: async () => {
    return apiRequest<{ avatar: null }>("/account/avatar", { method: "DELETE" });
  }
};

// ── Preferences API ──
export const preferencesApi = {
  get: async () => {
    return apiRequest<{ timezone: string }>("/preferences");
  },

  /** The server computes "today" and streaks in this IANA timezone. */
  setTimezone: async (timezone: string) => {
    return apiRequest<{ timezone: string }>("/preferences", {
      method: "PATCH",
      body: JSON.stringify({ timezone })
    });
  }
};
