import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { Award, Lock, Share2 } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY, tierColors } from "../constants/theme";
import { hapticSuccess } from "../utils/haptics";
import type { AchievementItem } from "../services/api";
import type { AchievementCelebration } from "../stores/achievementStore";
import { useReduceMotion } from "../hooks/useReduceMotion";
import { shortDate } from "../utils/date";
import { Button } from "./Button";
import { Confetti } from "./Confetti";

export interface AchievementBannerProps {
  celebration: AchievementCelebration | null;
  onDismiss: () => void;
  onShare: (achievement: AchievementItem) => void;
  /** A share is being prepared (image card capture / share sheet). */
  sharing?: boolean;
}

const tierLabel = (tier: string) => tier.charAt(0).toUpperCase() + tier.slice(1);

export function RewardsRow({ achievement }: { achievement: AchievementItem }) {
  const gems = achievement.gemBonus ?? 0;
  return (
    <View style={styles.rewards}>
      <View style={[styles.rewardChip, styles.xpChip]}>
        <Text style={styles.xpChipText}>⚡ +{achievement.xpBonus} XP</Text>
      </View>
      {gems > 0 && (
        <View style={[styles.rewardChip, styles.gemChip]}>
          <Text style={styles.gemChipText}>💎 +{gems}</Text>
        </View>
      )}
    </View>
  );
}

export const AchievementBanner: React.FC<AchievementBannerProps> = ({
  celebration,
  onDismiss,
  onShare,
  sharing = false
}) => {
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [showAll, setShowAll] = useState(false);
  const [burst, setBurst] = useState(0);

  const achievement = celebration?.achievements[0] ?? null;
  const others = celebration?.achievements.slice(1) ?? [];
  const mode = celebration?.mode ?? "unlock";
  const locked = mode === "details" && achievement?.unlocked === false;

  useEffect(() => {
    if (!celebration || !achievement) return;
    setShowAll(false);
    if (mode === "unlock") {
      void hapticSuccess();
      AccessibilityInfo.announceForAccessibility(
        `Achievement unlocked: ${achievement.name}.${others.length ? ` Plus ${others.length} more.` : ""}`
      );
      if (!reduceMotion) setBurst((value) => value + 1);
    }
    if (reduceMotion) {
      scale.setValue(1);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      return;
    }
    scale.setValue(0.8);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true })
    ]).start();
    // Only re-run for a new celebration.
  }, [celebration?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!celebration || !achievement) return null;
  const tier = tierColors(achievement.tier);
  const cardWidth = Math.min(width - 32, 400);
  const unlockedOn = shortDate(achievement.unlockedAt);

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {mode === "unlock" && <Confetti run={burst} />}
        <Animated.View
          accessibilityViewIsModal
          style={[styles.card, { width: cardWidth, borderColor: tier.border, opacity, transform: [{ scale }] }]}
        >
          <View style={[styles.aura, { backgroundColor: tier.bg }]} />
          <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
            <View style={[styles.iconContainer, { backgroundColor: tier.bg, borderColor: tier.border }]}>
              <Text style={[styles.emojiText, locked && styles.emojiLocked]}>{achievement.emoji || "🏆"}</Text>
              {locked && (
                <View style={styles.lockBadge}>
                  <Lock size={14} color={COLORS.text} />
                </View>
              )}
            </View>

            <View style={[styles.tierPill, { backgroundColor: tier.bg }]}>
              <Award size={12} color={tier.fg} />
              <Text style={[styles.tierText, { color: tier.fg }]}>{tierLabel(achievement.tier)}</Text>
            </View>

            <Text style={styles.kicker} accessibilityRole="header">
              {mode === "unlock" ? "Achievement unlocked!" : locked ? "How to unlock" : "Achievement"}
            </Text>
            <Text style={styles.name}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>

            <RewardsRow achievement={achievement} />
            <Text style={styles.rewardNote}>
              {mode === "unlock"
                ? "Added to your total"
                : locked
                  ? "Reward when you unlock it"
                  : unlockedOn
                    ? `Unlocked ${unlockedOn}`
                    : "Unlocked"}
            </Text>

            {others.length > 0 && (
              <View style={styles.more}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showAll }}
                  accessibilityLabel={showAll ? "Hide other badges" : `Show ${others.length} more badges`}
                  onPress={() => setShowAll((value) => !value)}
                  style={styles.moreToggle}
                >
                  <Text style={styles.moreText}>
                    {showAll ? "Hide" : `+${others.length} more`}
                  </Text>
                </TouchableOpacity>
                {showAll &&
                  others.map((other) => (
                    <View key={other.id} style={styles.moreRow}>
                      <Text style={styles.moreEmoji}>{other.emoji || "🏆"}</Text>
                      <View style={styles.moreCopy}>
                        <Text style={styles.moreName}>{other.name}</Text>
                        <Text style={styles.moreReward}>
                          +{other.xpBonus} XP{other.gemBonus ? ` · +${other.gemBonus} 💎` : ""}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            <View style={styles.actions}>
              {!locked && (
                <Button
                  title="Share"
                  variant="secondary"
                  icon={<Share2 size={16} color={COLORS.text} />}
                  onPress={() => onShare(achievement)}
                  loading={sharing}
                  style={styles.action}
                />
              )}
              <Button
                title={mode === "unlock" ? "Continue" : "Done"}
                onPress={onDismiss}
                style={styles.action}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg
  },
  card: {
    maxHeight: "90%",
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 10
  },
  scroll: {
    padding: SPACING.xxl,
    alignItems: "center"
  },
  aura: {
    position: "absolute",
    top: -80,
    alignSelf: "center",
    width: 280,
    height: 180,
    borderRadius: 140
  },
  iconContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    borderWidth: 2
  },
  emojiText: {
    fontSize: 46
  },
  emojiLocked: {
    opacity: 0.35
  },
  lockBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center"
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
    gap: 5,
    marginBottom: SPACING.md
  },
  tierText: {
    ...TYPOGRAPHY.label,
    letterSpacing: 0.5
  },
  kicker: {
    ...TYPOGRAPHY.label,
    color: COLORS.primaryText,
    letterSpacing: 0.5,
    marginBottom: 4
  },
  name: {
    ...TYPOGRAPHY.title1,
    textAlign: "center",
    marginBottom: SPACING.xs
  },
  description: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginBottom: SPACING.lg
  },
  rewards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: SPACING.sm
  },
  rewardChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1
  },
  xpChip: {
    backgroundColor: COLORS.xpLight,
    borderColor: COLORS.xpBorder
  },
  xpChipText: {
    color: COLORS.xpText,
    fontWeight: "800",
    fontSize: 14
  },
  gemChip: {
    backgroundColor: COLORS.gemLight,
    borderColor: COLORS.gemBorder
  },
  gemChipText: {
    color: COLORS.gem,
    fontWeight: "800",
    fontSize: 14
  },
  rewardNote: {
    ...TYPOGRAPHY.micro,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg
  },
  more: {
    alignSelf: "stretch",
    marginBottom: SPACING.md
  },
  moreToggle: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  moreText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primaryText
  },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border
  },
  moreEmoji: {
    fontSize: 26
  },
  moreCopy: {
    flex: 1
  },
  moreName: {
    ...TYPOGRAPHY.body,
    fontWeight: "700"
  },
  moreReward: {
    ...TYPOGRAPHY.micro,
    color: COLORS.xpText
  },
  actions: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: SPACING.sm
  },
  action: {
    flex: 1
  }
});
