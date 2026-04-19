const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
export class ApiError extends Error {
    status;
    details;
    constructor(message, status, details) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}
const buildHeaders = (init) => {
    const headers = new Headers(init?.headers);
    if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    return headers;
};
export const apiRequest = async (path, init) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: buildHeaders(init)
    });
    const hasJson = response.headers
        .get("content-type")
        ?.includes("application/json");
    const payload = hasJson ? (await response.json()) : null;
    if (!response.ok) {
        throw new ApiError(payload && "message" in payload && typeof payload.message === "string"
            ? payload.message
            : "Request failed", response.status, payload);
    }
    if (response.status === 204 || payload === null) {
        return undefined;
    }
    return payload.data;
};
