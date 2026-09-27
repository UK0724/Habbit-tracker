import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Flame } from "lucide-react-native";
import { COLORS, BORDER_RADIUS } from "../constants/theme";

export interface StreakBadgeProps {
  count: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  style?: ViewStyle;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  count,
  size = "md",
  showLabel = false,
  style
}) => {
  const isZero = count <= 0;

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.container };

    switch (size) {
      case "sm":
        base.paddingVertical = 2;
        base.paddingHorizontal = 6;
        break;
      case "lg":
        base.paddingVertical = 6;
        base.paddingHorizontal = 12;
        break;
      case "md":
      default:
        base.paddingVertical = 4;
        base.paddingHorizontal = 8;
        break;
    }

    if (isZero) {
      base.backgroundColor = COLORS.surfaceElevated;
      base.borderColor = COLORS.border;
    } else {
      base.backgroundColor = "rgba(249, 115, 22, 0.15)";
      base.borderColor = "rgba(249, 115, 22, 0.4)";
    }

    return base;
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return 11;
      case "lg":
        return 15;
      case "md":
      default:
        return 13;
    }
  };

  return (
    <View style={[getContainerStyle(), style]}>
      <Flame
        size={iconSizes[size]}
        color={isZero ? COLORS.textMuted : COLORS.streak}
        fill={isZero ? "transparent" : COLORS.streak}
      />
      <Text
        style={[
          styles.countText,
          {
            fontSize: getTextSize(),
            color: isZero ? COLORS.textMuted : COLORS.streak
          }
        ]}
      >
        {count}
        {showLabel ? (count === 1 ? " day" : " days") : ""}
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
