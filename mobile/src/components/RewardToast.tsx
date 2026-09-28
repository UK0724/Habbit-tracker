import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BORDER_RADIUS, COLORS } from "../constants/theme";
import type { XpCelebration } from "../stores/achievementStore";
import { useReduceMotion } from "../hooks/useReduceMotion";

export const rewardToastText = (
  toast: Pick<XpCelebration, "xp" | "gems" | "legendaryDay" | "checkin" | "message">
) => {
  const parts: string[] = [];
  if (toast.message) parts.push(toast.message);
  if (toast.xp !== 0) parts.push(`⚡ ${toast.xp > 0 ? "+" : ""}${toast.xp} XP`);
  if (toast.checkin)
    parts.push(`🔥 Day ${toast.checkin.streak} check-in${toast.checkin.xp > 0 ? ` +${toast.checkin.xp} XP` : ""}`);
  if (toast.gems > 0) parts.push(`💎 +${toast.gems}`);
  if (toast.legendaryDay) parts.push("Legendary Day!");
  return parts.join(" · ");
};

/** Non-modal reward pill under the header. Auto-hides after ~2.2 s. */
export function RewardToast({
  toast,
  onHide
}: {
  toast: XpCelebration | null;
  onHide: () => void;
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    const text = rewardToastText(toast);
    if (text) AccessibilityInfo.announceForAccessibility(text.replace(/[⚡💎🔥❄️]/gu, "").trim());
    const animation = Animated.sequence([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }),
      Animated.delay(2200),
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true })
    ]);
    animation.start(({ finished }) => finished && onHide());
    return () => animation.stop();
  }, [toast, anim, onHide]);

  if (!toast) return null;
  const negative =
    toast.xp < 0 && toast.gems === 0 && !toast.legendaryDay && !toast.checkin && !toast.message;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.pill,
        toast.legendaryDay && styles.legendary,
        negative && styles.negative,
        {
          top: insets.top + 66,
          opacity: anim,
          transform: reduce
            ? []
            : [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }]
        }
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[styles.text, negative && styles.textNegative]}
      >
        {rewardToastText(toast)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "90%",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.xpBorder,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 1000
  },
  legendary: {
    borderColor: COLORS.goldBorder,
    backgroundColor: "#2A2410"
  },
  negative: {
    borderColor: COLORS.border
  },
  text: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 15
  },
  textNegative: {
    color: COLORS.textMuted,
    fontWeight: "600"
  }
});
