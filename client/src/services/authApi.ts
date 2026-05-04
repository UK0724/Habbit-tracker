import { apiRequest } from "./api";

type AuthResponse = {
  token: string;
  user: { id: string; email: string };
};

export const registerApi = (email: string, password: string) =>
  apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const loginApi = (email: string, password: string) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

export const getMeApi = () =>
  apiRequest<{ id: string; email: string }>("/auth/me");
