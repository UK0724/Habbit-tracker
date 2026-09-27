import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
export const getItemAsync = async (key: string) =>
  Platform.OS === "web"
    ? localStorage.getItem(key)
    : SecureStore.getItemAsync(key);
export const setItemAsync = async (key: string, value: string) => {
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
};
export const deleteItemAsync = async (key: string) => {
  if (Platform.OS === "web") localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
};
