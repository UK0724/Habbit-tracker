import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, ViewStyle } from "react-native";
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { Zap } from "lucide-react-native";

export interface XPBarProps {
  currentXP: number;
  neededXP: number;
  level?: number;
  title?: string;
  showDetails?: boolean;
  style?: ViewStyle;
}

export const XPBar: React.FC<XPBarProps> = ({
  currentXP,
  neededXP,
  level,
  title,
  showDetails = true,
  style
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Safe percentage calculation
  const targetPercent = Math.max(
    0,
    Math.min(100, neededXP > 0 ? (currentXP / neededXP) * 100 : 100)
  );

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: targetPercent,
      duration: 600,
      useNativeDriver: false
    }).start();
  }, [targetPercent]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"]
  });

  return (
    <View style={[styles.container, style]}>
      {showDetails && (
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Zap size={15} color={COLORS.xp} />
            <Text style={styles.levelText}>
              {level ? `Level ${level}` : "Experience"}
              {title ? ` · ${title}` : ""}
            </Text>
          </View>
          <Text style={styles.xpText}>
            {currentXP.toLocaleString()} / {neededXP.toLocaleString()} XP
          </Text>
        </View>
      )}

      {/* Progress track */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolation
            }
          ]}
        />
      </View>

      {showDetails && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Math.round(targetPercent)}% to next level
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs + 2
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  levelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "700"
  },
  xpText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  track: {
    height: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.xp,
    borderRadius: BORDER_RADIUS.full
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4
  },
  footerText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "500"
  }
});
