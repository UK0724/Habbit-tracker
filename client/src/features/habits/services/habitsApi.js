import { apiRequest } from "../../../services/api";
export const getHabits = (date) => apiRequest(`/habits?date=${encodeURIComponent(date)}`);
export const getHabit = (id) => apiRequest(`/habits/${id}`);
export const createHabit = (input) => apiRequest("/habits", {
    method: "POST",
    body: JSON.stringify(input)
});
export const updateHabit = (id, input) => apiRequest(`/habits/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
});
export const deleteHabit = (id) => apiRequest(`/habits/${id}`, {
    method: "DELETE"
});
