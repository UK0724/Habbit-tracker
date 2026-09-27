import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const hapticSuccess = async () => {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore on unsupported platforms
  }
};

export const hapticError = async () => {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Ignore on unsupported platforms
  }
};

export const hapticLight = async () => {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore
  }
};

export const hapticMedium = async () => {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Ignore
  }
};

export const hapticHeavy = async () => {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // Ignore
  }
};

export const hapticSelection = async () => {
  if (Platform.OS === "web") return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore
  }
};
