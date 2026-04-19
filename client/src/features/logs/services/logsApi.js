import { apiRequest } from "../../../services/api";
export const getHabitLogs = (habitId, limit = 12) => apiRequest(`/habits/${habitId}/logs?limit=${encodeURIComponent(limit.toString())}`);
export const createHabitLog = (habitId, input) => apiRequest(`/habits/${habitId}/logs`, {
    method: "POST",
    body: JSON.stringify(input)
});
export const updateHabitLog = (habitId, logId, input) => apiRequest(`/habits/${habitId}/logs/${logId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
});
export const getTodayLogs = () => apiRequest("/logs/today");
