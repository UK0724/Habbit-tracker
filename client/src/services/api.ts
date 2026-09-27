import { useAuthStore } from "../stores/authStore";
import type { ApiResponse } from "../shared/types/habit";

const resolveEndpoint = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
  if (configuredBase) {
    const apiPath = cleanPath.startsWith("/api/")
      ? cleanPath.slice(4)
      : cleanPath;
    return `${configuredBase}${apiPath}`;
  }

  // Without an explicit backend, use the same-origin API proxy.
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.protocol !== "file:"
  ) {
    if (cleanPath.startsWith("/api/")) {
      return cleanPath;
    }
    return `/api${cleanPath}`;
  }

  // Packaged desktop app (file:// protocol) or non-browser environment:
  const base = (
    import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL !== "/api"
      ? import.meta.env.VITE_API_BASE_URL
      : "http://localhost:4000/api"
  ).replace(/\/$/, "");

  if (cleanPath.startsWith("/api/")) {
    return `${base}${cleanPath.slice(4)}`;
  }
  return `${base}${cleanPath}`;
};

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
  const sessionToken = useAuthStore.getState().token;
  const endpoint = resolveEndpoint(path);
  const response = await fetchWithTimeout(endpoint, {
    ...init,
    headers: buildHeaders(init)
  });

  if (sessionToken !== useAuthStore.getState().token)
    throw new ApiError("Session changed. Please retry.", 409);
  const hasJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = hasJson ? ((await response.json()) as ApiResponse<T>) : null;

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    const message =
      (payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof (payload as { message?: unknown }).message === "string" &&
        (payload as { message: string }).message) ||
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error?: unknown }).error === "string" &&
        (payload as { error: string }).error) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new ApiError(
      "The server returned an invalid response. Please try again.",
      502
    );
  }

  return payload.data;
};
