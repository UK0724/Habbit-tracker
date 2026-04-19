import { apiRequest } from "../../../services/api";
export const getHabitStats = (habitId) => apiRequest(`/habits/${habitId}/stats`);
