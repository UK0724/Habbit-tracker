import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Shield, Award, Crown } from "lucide-react-native";
import { COLORS, BORDER_RADIUS } from "../constants/theme";

export interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  style?: ViewStyle;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  title,
  size = "md",
  showTitle = true,
  style
}) => {
  // Determine tier styling based on level
  const getTierColor = (lvl: number) => {
    if (lvl >= 50)
      return {
        bg: "rgba(168, 85, 247, 0.2)",
        border: "#A855F7",
        text: "#C084FC"
      }; // Platinum/Mythic
    if (lvl >= 20)
      return {
        bg: "rgba(245, 158, 11, 0.2)",
        border: "#F59E0B",
        text: "#FBBF24"
      }; // Gold
    if (lvl >= 10)
      return {
        bg: "rgba(148, 163, 184, 0.2)",
        border: "#94A3B8",
        text: "#CBD5E1"
      }; // Silver
    return { bg: "rgba(217, 119, 6, 0.2)", border: "#D97706", text: "#F59E0B" }; // Bronze
  };

  const tier = getTierColor(level);

  const getIcon = () => {
    const iconSize = size === "sm" ? 12 : size === "lg" ? 18 : 14;
    if (level >= 50) return <Crown size={iconSize} color={tier.text} />;
    if (level >= 20) return <Award size={iconSize} color={tier.text} />;
    return <Shield size={iconSize} color={tier.text} />;
  };

  return (
    <View
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
      {getIcon()}
      <Text
        style={[
          styles.levelNumber,
          {
            color: tier.text,
            fontSize: size === "sm" ? 11 : size === "lg" ? 15 : 13
          }
        ]}
      >
        Lv. {level}
      </Text>
      {showTitle && title && (
        <Text
          style={[
            styles.titleText,
            {
              fontSize: size === "sm" ? 10 : size === "lg" ? 13 : 11
            }
          ]}
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
    alignSelf: "flex-start"
  },
  levelNumber: {
    fontWeight: "700"
  },
  titleText: {
    color: COLORS.textSecondary,
    fontWeight: "600"
  }
});
