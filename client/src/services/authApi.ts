import { apiRequest } from "./api";

type AuthResponse = {
  token: string;
  user: { id: string; email: string };
};

export const registerApi = (email: string, password: string) =>
  apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  });

export const loginApi = (email: string, password: string) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  });

export const getMeApi = () =>
  apiRequest<{ id: string; email: string }>("/auth/me");

export const deleteAccountApi = (password: string) =>
  apiRequest<void>("/account", {
    method: "DELETE",
    body: JSON.stringify({ password })
  });

/** Always resolves the same way whether or not the account exists. */
export const forgotPasswordApi = (email: string) =>
  apiRequest<{ sent: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });

export const resetPasswordApi = (token: string, password: string) =>
  apiRequest<{ reset: boolean }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password })
  });
