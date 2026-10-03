import React from "react";
import { Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Plus } from "lucide-react-native";
import { COLORS, LIST } from "../constants/theme";
import { hapticLight } from "../utils/haptics";

/**
 * Standard floating action button (56dp, primary). Place it inside a
 * `position: relative` screen container; it sits bottom-right above the
 * tab bar. Screens add `FAB_CLEARANCE` bottom padding so it never covers
 * the last list row.
 */
export const FAB_CLEARANCE = LIST.fabSize + 16 * 2;

export function Fab({
  onPress,
  accessibilityLabel,
  icon,
  style
}: {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={() => {
        void hapticLight();
        onPress();
      }}
      android_ripple={{ color: "rgba(255, 255, 255, 0.24)", foreground: true, borderless: false }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        pressed && Platform.OS !== "android" ? styles.pressed : undefined,
        style
      ]}
    >
      {icon ?? <Plus size={26} color={COLORS.white} strokeWidth={2.5} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: LIST.fabSize,
    height: LIST.fabSize,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  pressed: {
    backgroundColor: COLORS.primaryHover
  }
});
