import React, { useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Snowflake } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { gamificationApi, type GamificationProfile, type StreakRepairOffer } from "../services/api";
import { useRepairHabitStreak } from "../hooks/useStreakActions";
import { planRepair, repairHeadline } from "../utils/streakRepair";

export interface StreakRepairBannerProps {
  habitId: string;
  habitTitle: string;
  offer: StreakRepairOffer;
  /** Read-only (e.g. yesterday's placeholder list while today loads). */
  disabled?: boolean;
}

/** "Streak broken on Sat, Sep 26 — Repair for 🛡️1" with a confirm step. */
export function StreakRepairBanner({ habitId, habitTitle, offer, disabled = false }: StreakRepairBannerProps) {
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
    <View style={styles.banner} accessibilityRole="summary">
      <View style={styles.copy}>
        <Snowflake size={16} color={COLORS.frozen} />
        <Text style={styles.headline} maxFontSizeMultiplier={1.3}>
          {headline}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.button, !canPress && styles.buttonDisabled]}
        onPress={onPress}
        disabled={!canPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${headline} for ${habitTitle}. ${buttonLabel.replace(/[🛡️💎]/gu, "")}`}
        accessibilityState={{ disabled: !canPress, busy }}
      >
        {busy ? (
          <ActivityIndicator size="small" color={COLORS.frozen} />
        ) : (
          <Text
            style={[styles.buttonText, !plan.affordable && walletKnown && styles.buttonTextMuted]}
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
          >
            {buttonLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    backgroundColor: COLORS.frozenLight,
    borderColor: COLORS.frozenBorder,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 6,
    paddingLeft: SPACING.md,
    paddingRight: 6,
    marginBottom: SPACING.sm
  },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150
  },
  headline: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: "700",
    flexShrink: 1
  },
  button: {
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.frozenBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: "auto"
  },
  buttonDisabled: {
    borderColor: COLORS.border,
    opacity: 0.8
  },
  buttonText: {
    ...TYPOGRAPHY.label,
    color: COLORS.frozen
  },
  buttonTextMuted: {
    color: COLORS.textSecondary
  }
});
