import { Audio } from "expo-av";
import { Platform } from "react-native";

export const playSoundEffect = async (
  _type: "complete" | "levelup" | "achievement"
) => {
  if (Platform.OS === "web") return;
  try {
    // Configure audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false
    });
    // In production, audio assets can be loaded here with Audio.Sound.createAsync(require(...))
  } catch {
    // Ignore audio error
  }
};
