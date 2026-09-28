import React, { useEffect, useState } from "react";
import { AccessibilityInfo, Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { useCelebrationStore, type StreakCelebration } from "../stores/achievementStore";
import { gamificationApi } from "../services/api";
import { useRestoreStreak } from "../hooks/useStreakActions";
import { timeLeft } from "../utils/date";
import { Button } from "./Button";

/** Bottom sheet shown when the daily check-in reports a broken streak. */
export function StreakLostSheet({
  celebration,
  onDismiss
}: {
  celebration: StreakCelebration | null;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { data: profile } = useQuery({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile,
    enabled: Boolean(celebration)
  });
  const restore = useRestoreStreak();
  const dismissById = useCelebrationStore((state) => state.dismiss);
  // Closing is blocked while a restore is in flight so its result can't land on another sheet.
  const close = () => {
    if (!restore.isPending) onDismiss();
  };
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!celebration) return;
    AccessibilityInfo.announceForAccessibility(
      celebration.previousStreak > 0
        ? `Your ${celebration.previousStreak}-day streak ended.`
        : "Your streak ended."
    );
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [celebration]);

  if (!celebration) return null;
  const remaining = timeLeft(celebration.restoreExpiresAt, now);
  // The live profile wins: the streak may already have been restored elsewhere.
  const canRestore =
    celebration.canRestore &&
    (remaining !== null || !celebration.restoreExpiresAt) &&
    (profile ? profile.brokenStreak != null : true);
  const gems = profile?.gems;
  const enoughGems = gems == null || gems >= celebration.restoreCost;

  return (
    <Modal transparent visible animationType="slide" statusBarTranslucent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
          <View style={styles.handle} />
          <View style={styles.icon}>
            <Flame size={34} color={COLORS.textMuted} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Streak lost
          </Text>
          <Text style={styles.body}>
            {celebration.previousStreak > 0
              ? `Your ${celebration.previousStreak}-day check-in streak ended. Today is day 1 of a new one.`
              : "Your check-in streak ended. Today is day 1 of a new one."}
          </Text>
          {canRestore && (
            <View style={styles.restoreBox}>
              <Text style={styles.restoreTitle}>
                Restore it for {celebration.restoreCost} 💎
              </Text>
              <Text style={styles.restoreBody}>
                {remaining ? `Available for ${remaining}. ` : ""}
                {gems == null ? "" : `You have ${gems} ${gems === 1 ? "gem" : "gems"}.`}
              </Text>
              <Button
                title={enoughGems ? `Restore for ${celebration.restoreCost} 💎` : `Need ${celebration.restoreCost} 💎`}
                variant="primary"
                disabled={!enoughGems}
                loading={restore.isPending}
                onPress={() => {
                  const id = celebration.id;
                  restore.mutate(undefined, { onSuccess: () => dismissById(id) });
                }}
                fullWidth
                style={styles.restoreButton}
              />
            </View>
          )}
          <Button
            title="Start fresh"
            variant="secondary"
            onPress={close}
            disabled={restore.isPending}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.overlay
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: COLORS.border
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.lg
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md
  },
  title: {
    ...TYPOGRAPHY.title1
  },
  body: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg
  },
  restoreBox: {
    alignSelf: "stretch",
    backgroundColor: COLORS.gemLight,
    borderColor: COLORS.gemBorder,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  restoreTitle: {
    ...TYPOGRAPHY.title3
  },
  restoreBody: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  restoreButton: {
    marginTop: SPACING.md
  }
});
