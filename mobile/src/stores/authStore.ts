import { create } from "zustand";
import * as SecureStore from "../services/storage";
import { SECURE_STORE_KEYS } from "../constants/config";
import { clearHabitReminders } from "../services/notifications";

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (token: string, user: AuthUser) => {
    try {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN, token);
      await SecureStore.setItemAsync(
        SECURE_STORE_KEYS.AUTH_USER,
        JSON.stringify(user)
      );
    } catch {
      await Promise.allSettled([
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_USER)
      ]);
      throw new Error(
        "Could not save your sign-in securely. Please try again."
      );
    }
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN);
    } catch {
      throw new Error("Could not sign out securely. Please try again.");
    }
    try {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTH_USER);
    } catch (error) {
      console.error("[authStore] Failed to clear saved user", error);
    }
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    // Scheduled reminders outlive the session; a signed-out or deleted user
    // must not keep receiving them.
    await clearHabitReminders().catch((error) =>
      console.error("[authStore] Failed to clear habit reminders", error)
    );
  },

  initializeAuth: async () => {
    try {
      const [token, userStr] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTH_USER)
      ]);

      if (token && userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        set({ token, user, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch (e) {
      console.error("[authStore] Failed to read from SecureStore", e);
    }
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  }
}));
