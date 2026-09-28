import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Flame } from "lucide-react-native";
import { COLORS, BORDER_RADIUS } from "../constants/theme";

export interface StreakBadgeProps {
  count: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  /** Weekly habits count their streak in weeks. */
  unit?: "day" | "week";
  style?: ViewStyle;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  count,
  size = "md",
  showLabel = false,
  unit = "day",
  style
}) => {
  const isZero = count <= 0;
  const iconSize = size === "sm" ? 12 : size === "lg" ? 20 : 16;
  const fontSize = size === "sm" ? 11 : size === "lg" ? 15 : 13;
  const label = `${count} ${unit}${count === 1 ? "" : "s"}`;

  return (
    <View
      accessible
      accessibilityLabel={`${label} streak`}
      style={[
        styles.container,
        {
          paddingVertical: size === "sm" ? 2 : size === "lg" ? 6 : 4,
          paddingHorizontal: size === "sm" ? 6 : size === "lg" ? 12 : 8,
          backgroundColor: isZero ? COLORS.surfaceElevated : COLORS.streakLight,
          borderColor: isZero ? COLORS.border : COLORS.streakBorder
        },
        style
      ]}
    >
      <Flame
        size={iconSize}
        color={isZero ? COLORS.textMuted : COLORS.streak}
        fill={isZero ? "transparent" : COLORS.streak}
      />
      <Text
        maxFontSizeMultiplier={1.4}
        style={[styles.countText, { fontSize, color: isZero ? COLORS.textMuted : COLORS.streak }]}
      >
        {showLabel ? label : count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 4,
    alignSelf: "flex-start"
  },
  countText: {
    fontWeight: "700"
  }
});
