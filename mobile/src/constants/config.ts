import * as SecureStore from "../services/storage";

import { Platform } from "react-native";
export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__
    ? Platform.OS === "android"
      ? "http://10.0.2.2:4000/api"
      : "http://localhost:4000/api"
    : "");
export const normalizeApiUrl = (value: string) => {
  const url = new URL(value.trim());
  const address = url.hostname.split(".").map(Number);
  const privateLanIp =
    address.length === 4 &&
    address.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) &&
    (address[0] === 10 ||
      (address[0] === 172 && address[1] >= 16 && address[1] <= 31) ||
      (address[0] === 192 && address[1] === 168));
  const previewLanHttp =
    process.env.EXPO_PUBLIC_ALLOW_LAN_HTTP === "true" && privateLanIp;
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Enter a valid API URL");
  if (!__DEV__ && url.protocol !== "https:" && !previewLanHttp)
    throw new Error("Production requires an HTTPS API URL");
  return url.toString().replace(/\/+$/, "");
};

export const SECURE_STORE_KEYS = {
  AUTH_TOKEN: "habit_tracker_auth_token",
  AUTH_USER: "habit_tracker_auth_user",
  API_BASE_URL: "habit_tracker_api_url"
} as const;

let cachedApiUrl: string | null = null;

export const getApiBaseUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const stored = await SecureStore.getItemAsync(
      SECURE_STORE_KEYS.API_BASE_URL
    );
    if (stored) {
      cachedApiUrl = normalizeApiUrl(stored);
      return cachedApiUrl;
    }
  } catch {
    // Fallback if SecureStore unavailable
  }
  if (!DEFAULT_API_URL)
    throw new Error(
      "API URL is not configured. Set EXPO_PUBLIC_API_URL before building."
    );
  cachedApiUrl = normalizeApiUrl(DEFAULT_API_URL);
  return cachedApiUrl;
};

export const setApiBaseUrl = async (url: string): Promise<void> => {
  const trimmed = normalizeApiUrl(url);
  try {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.API_BASE_URL, trimmed);
  } catch {
    throw new Error("Could not save the API URL. Please try again.");
  }
  cachedApiUrl = trimmed;
};
