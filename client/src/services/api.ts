import { useAuthStore } from "../stores/authStore";
import type { ApiResponse } from "../shared/types/habit";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

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

const buildHeaders = (init?: RequestInit) => {
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init)
  });

  const hasJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = hasJson ? ((await response.json()) as ApiResponse<T>) : null;

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    throw new ApiError(
      payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Request failed",
      response.status,
      payload
    );
  }

  if (response.status === 204 || payload === null) {
    return undefined as T;
  }

  return payload.data;
};
