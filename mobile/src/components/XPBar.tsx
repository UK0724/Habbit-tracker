import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, ViewStyle, Easing } from "react-native";
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { Zap } from "lucide-react-native";

export interface XPBarProps {
  currentXP: number;
  /** null at max level. */
  neededXP: number | null;
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
  const flash = useRef(new Animated.Value(0)).current;
  const previousLevel = useRef<number | undefined>(level);
  const isMax = neededXP == null;

  const targetPercent = isMax
    ? 100
    : Math.max(0, Math.min(100, neededXP > 0 ? (currentXP / neededXP) * 100 : 100));

  useEffect(() => {
    const leveledUp =
      previousLevel.current != null && level != null && level > previousLevel.current;
    previousLevel.current = level;
    const fillTo = (toValue: number, duration: number) =>
      Animated.timing(animatedWidth, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      });
    const animation = leveledUp
      ? Animated.sequence([
          fillTo(100, 450),
          Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: false }),
          Animated.timing(flash, { toValue: 0, duration: 260, useNativeDriver: false }),
          Animated.timing(animatedWidth, { toValue: 0, duration: 0, useNativeDriver: false }),
          fillTo(targetPercent, 650)
        ])
      : fillTo(targetPercent, 600);
    animation.start();
    return () => animation.stop();
  }, [targetPercent, level, animatedWidth, flash]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"]
  });

  const remaining = isMax ? 0 : Math.max(0, neededXP - currentXP);
  const summary = isMax
    ? "Max level reached"
    : level
      ? `${remaining.toLocaleString()} XP to Level ${level + 1}`
      : `${remaining.toLocaleString()} XP to next level`;

  return (
    <View style={[styles.container, style]}>
      {showDetails && (
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Zap size={15} color={COLORS.xpText} />
            <Text style={styles.levelText} numberOfLines={1}>
              {level ? `Level ${level}` : "Experience"}
              {title ? ` · ${title}` : ""}
            </Text>
          </View>
          {!isMax && (
            <Text style={styles.xpText}>
              {currentXP.toLocaleString()} / {neededXP.toLocaleString()} XP
            </Text>
          )}
        </View>
      )}

      <View
        style={styles.track}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={level ? `Level ${level} progress. ${summary}` : summary}
        accessibilityValue={
          isMax ? { text: "Max level" } : { min: 0, max: neededXP, now: currentXP }
        }
      >
        <Animated.View style={[styles.fill, isMax && styles.fillMax, { width: widthInterpolation }]} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />
      </View>

      {showDetails && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{summary}</Text>
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
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.xs + 2
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1
  },
  levelText: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    flexShrink: 1
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
  fillMax: {
    backgroundColor: COLORS.gold
  },
  flash: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4
  },
  footerText: {
    ...TYPOGRAPHY.micro
  }
});
