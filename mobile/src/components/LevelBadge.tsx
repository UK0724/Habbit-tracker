import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Shield, Award, Crown, Star } from "lucide-react-native";
import { COLORS, BORDER_RADIUS, TIER_COLORS, levelTier } from "../constants/theme";

export interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  style?: ViewStyle;
}

/** Tiers: bronze < 10, silver 10+, gold 25+, platinum 50+, crown at 100. */
export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  title,
  size = "md",
  showTitle = true,
  style
}) => {
  const tierName = levelTier(level);
  const tier = TIER_COLORS[tierName];
  const iconSize = size === "sm" ? 12 : size === "lg" ? 18 : 14;
  const Icon =
    level >= 100 ? Crown : tierName === "platinum" ? Star : tierName === "gold" ? Award : Shield;

  return (
    <View
      accessible
      accessibilityLabel={`Level ${level}${title ? `, ${title}` : ""}`}
      style={[
        styles.badge,
        {
          backgroundColor: tier.bg,
          borderColor: tier.border,
          paddingVertical: size === "sm" ? 3 : size === "lg" ? 8 : 5,
          paddingHorizontal: size === "sm" ? 8 : size === "lg" ? 14 : 10
        },
        style
      ]}
    >
      <Icon size={iconSize} color={tier.fg} />
      <Text
        maxFontSizeMultiplier={1.4}
        style={[styles.levelNumber, { color: tier.fg, fontSize: size === "sm" ? 11 : size === "lg" ? 15 : 13 }]}
      >
        Lv. {level}
      </Text>
      {showTitle && title && (
        <Text
          maxFontSizeMultiplier={1.4}
          style={[styles.titleText, { fontSize: size === "lg" ? 13 : 11 }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 6,
    alignSelf: "flex-start",
    maxWidth: "100%"
  },
  levelNumber: {
    fontWeight: "700"
  },
  titleText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    flexShrink: 1
  }
});
