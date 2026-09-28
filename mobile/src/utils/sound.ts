import { useEffect, useState } from "react";
import { Audio } from "expo-av";
import { Platform } from "react-native";
import * as Storage from "../services/storage";

export type SoundEffect = "xp" | "achievement" | "levelup";

const SOUND_SETTING_KEY = "pulse_sound_effects";
const SOURCES: Record<SoundEffect, number> = {
  xp: require("../../assets/sounds/xp.wav"),
  achievement: require("../../assets/sounds/achievement.wav"),
  levelup: require("../../assets/sounds/levelup.wav")
};
const VOLUME: Record<SoundEffect, number> = { xp: 0.45, achievement: 0.6, levelup: 0.65 };

let enabled = true;
let settingLoaded: Promise<void> | null = null;
const listeners = new Set<(value: boolean) => void>();
const loaded = new Map<SoundEffect, Audio.Sound>();
let preloading: Promise<void> | null = null;

const loadSetting = () => {
  settingLoaded ??= Storage.getItemAsync(SOUND_SETTING_KEY)
    .then((value) => {
      enabled = value !== "off";
    })
    .catch(() => undefined);
  return settingLoaded;
};

export const isSoundEnabled = async () => {
  await loadSetting();
  return enabled;
};

export const setSoundEnabled = async (value: boolean) => {
  enabled = value;
  listeners.forEach((listener) => listener(value));
  try {
    await Storage.setItemAsync(SOUND_SETTING_KEY, value ? "on" : "off");
  } catch (error) {
    console.error("[sound] Could not save the sound setting", error);
  }
};

/** Persisted sound-effects toggle for settings UI. */
export const useSoundEnabled = (): [boolean, (value: boolean) => void] => {
  const [value, setValue] = useState(enabled);
  useEffect(() => {
    let active = true;
    void isSoundEnabled().then((current) => active && setValue(current));
    listeners.add(setValue);
    return () => {
      active = false;
      listeners.delete(setValue);
    };
  }, []);
  return [value, (next) => void setSoundEnabled(next)];
};

/** Loads all effects once; safe to call repeatedly and never throws. */
export const preloadSounds = () => {
  if (Platform.OS === "web") return Promise.resolve();
  preloading ??= (async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true
      });
    } catch {
      // Audio mode is best effort.
    }
    await Promise.all(
      (Object.keys(SOURCES) as SoundEffect[]).map(async (name) => {
        try {
          const { sound } = await Audio.Sound.createAsync(SOURCES[name], {
            volume: VOLUME[name],
            shouldPlay: false
          });
          loaded.set(name, sound);
        } catch (error) {
          console.error(`[sound] Could not load ${name}`, error);
        }
      })
    );
  })();
  return preloading;
};

/** Plays an effect unless muted. Never throws. */
export const playSoundEffect = async (name: SoundEffect) => {
  if (Platform.OS === "web") return;
  try {
    if (!(await isSoundEnabled())) return;
    await preloadSounds();
    const sound = loaded.get(name);
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Sound is decoration; never let it break a flow.
  }
};
