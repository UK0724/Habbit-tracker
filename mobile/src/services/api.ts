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
  HabitStats
} from "@habit-tracker/shared";

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

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface GamificationProfile {
  userId: string;
  totalXP: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpNeeded: number | null;
  gems: number;
  loginStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  streakFreezes: number;
  achievementCount: number;
  today: string;
}

export interface AchievementItem {
  id: string;
  name: string;
  description: string;
  xpBonus: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  emoji: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface DailyCheckinResult {
  alreadyCheckedIn: boolean;
  streak: number;
  longestStreak: number;
  streakBroken: boolean;
  freezeUsed: boolean;
  xpAwarded: number;
}

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
  const baseUrl = await getApiBaseUrl();
  const headers = await buildHeaders(init);

  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      ...init,
      headers
    });
  } catch (error: unknown) {
    throw new ApiError(
      error instanceof Error
        ? `Network Error: ${error.message}`
        : "Unable to reach server. Please check your connection or API URL in Profile.",
      0
    );
  }

  if (sessionToken !== useAuthStore.getState().token)
    throw new ApiError("Session changed. Please retry.", 409);

  const contentType = response.headers.get("content-type");
  const hasJson = contentType?.includes("application/json");
  const payload = hasJson ? ((await response.json()) as ApiResponse<T>) : null;

  if (!response.ok) {
    if (response.status === 401) {
      await useAuthStore.getState().clearAuth();
    }

    const message =
      payload && typeof (payload as { message?: string }).message === "string"
        ? (payload as { message?: string }).message
        : `Request failed with status ${response.status}`;

    throw new ApiError(message || "Request failed", response.status, payload);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  if (!payload || typeof payload !== "object" || !("data" in payload))
    throw new ApiError("Invalid server response. Check your API URL.", 502);
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

  getMe: async () => {
    return apiRequest<{ id: string; email: string }>("/auth/me");
  }
};

// ── Habit API ──
export const habitApi = {
  list: async (params?: {
    date?: string;
    includeArchived?: boolean;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.includeArchived) query.set("includeArchived", "true");
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return apiRequest<HabitListItem[]>(`/habits${qs ? `?${qs}` : ""}`);
  },

  get: async (id: string) => {
    return apiRequest<Habit>(`/habits/${id}`);
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
  }
};

// ── Habit Logs API ──
export const habitLogApi = {
  getTodayLogs: async () => {
    return apiRequest<TodayLogEntry[]>("/logs/today");
  },

  list: async (habitId: string, limit = 30) => {
    return apiRequest<HabitLog[]>(`/habits/${habitId}/logs?limit=${limit}`);
  },

  create: async (habitId: string, payload: SaveHabitLogInput) => {
    return apiRequest<HabitLog>(`/habits/${habitId}/logs`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  update: async (
    habitId: string,
    logId: string,
    payload: SaveHabitLogInput
  ) => {
    return apiRequest<HabitLog>(`/habits/${habitId}/logs/${logId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  delete: async (habitId: string, logId: string) => {
    return apiRequest<void>(`/habits/${habitId}/logs/${logId}`, {
      method: "DELETE"
    });
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
    return apiRequest<DailyCheckinResult>("/gamification/checkin", {
      method: "POST"
    });
  },

  useStreakFreeze: async () => {
    return apiRequest<{ gems: number; streakFreezes: number }>(
      "/gamification/freeze",
      {
        method: "POST"
      }
    );
  },

  issueAdToken: async () => {
    return apiRequest<{ adToken: string }>("/gamification/ad-token", {
      method: "POST"
    });
  },

  restoreStreak: async (adToken: string) => {
    return apiRequest<{ streak: number; restored: boolean }>(
      "/gamification/restore",
      {
        method: "POST",
        body: JSON.stringify({ adToken })
      }
    );
  }
};
