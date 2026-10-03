import React, { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Snowflake } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING } from "../constants/theme";
import { gamificationApi, type GamificationProfile, type StreakRepairOffer } from "../services/api";
import { useRepairHabitStreak } from "../hooks/useStreakActions";
import { planRepair, repairHeadline } from "../utils/streakRepair";

export interface StreakRepairBannerProps {
  habitId: string;
  habitTitle: string;
  offer: StreakRepairOffer;
  /** Read-only (e.g. yesterday's placeholder list while today loads). */
  disabled?: boolean;
  /** Left padding so the row lines up with list-row text (Today list). */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * "Streak broken on Sat, Sep 26 · Repair for 🛡️1" with a confirm step.
 * A subtle inline row (no box): cyan text plus a small text button, placed
 * directly under the affected habit.
 */
export function StreakRepairBanner({
  habitId,
  habitTitle,
  offer,
  disabled = false,
  inset = 0,
  style
}: StreakRepairBannerProps) {
  const { data: profile, isLoading } = useQuery<GamificationProfile>({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile
  });
  const repair = useRepairHabitStreak(habitId);
  // One confirm dialog at a time, even on a fast double tap.
  const confirming = useRef(false);
  const plan = planRepair(offer, profile);
  const headline = repairHeadline(offer);
  const walletKnown = Boolean(profile) && !isLoading;
  const busy = repair.isPending;
  const canPress = walletKnown && plan.affordable && !busy && !disabled;

  const onPress = () => {
    if (!canPress || !plan.confirm || confirming.current) return;
    confirming.current = true;
    const release = () => {
      confirming.current = false;
    };
    Alert.alert(
      "Repair this streak?",
      plan.confirm,
      [
        { text: "Cancel", style: "cancel", onPress: release },
        {
          text: plan.payWith === "freeze" ? "Use freeze" : `Spend ${plan.cost} 💎`,
          onPress: () => {
            release();
            repair.mutate(offer.date);
          }
        }
      ],
      { cancelable: true, onDismiss: release }
    );
  };

  const buttonLabel = !walletKnown ? "Repair" : plan.label;

  return (
    <View style={[styles.banner, { paddingLeft: inset }, style]} accessibilityRole="summary">
      <View style={styles.copy}>
        <Snowflake size={14} color={COLORS.frozen} />
        <Text style={styles.headline} maxFontSizeMultiplier={1.3}>
          {headline}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && Platform.OS !== "android" ? styles.buttonPressed : undefined
        ]}
        onPress={onPress}
        disabled={!canPress}
        android_ripple={canPress ? { color: COLORS.frozenLight } : undefined}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`${headline} for ${habitTitle}. ${buttonLabel.replace(/[🛡️💎]/gu, "")}`}
        accessibilityState={{ disabled: !canPress, busy }}
      >
        {busy ? (
          <ActivityIndicator size="small" color={COLORS.frozen} />
        ) : (
          <Text
            style={[styles.buttonText, (!canPress || (!plan.affordable && walletKnown)) && styles.buttonTextMuted]}
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
          >
            {buttonLabel}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: SPACING.sm,
    paddingRight: SPACING.xs
  },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150,
    paddingVertical: SPACING.xs
  },
  headline: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.frozen,
    flexShrink: 1
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: "auto",
    overflow: "hidden"
  },
  buttonPressed: {
    backgroundColor: COLORS.frozenLight
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.frozen
  },
  buttonTextMuted: {
    color: COLORS.textSecondary
  }
});
