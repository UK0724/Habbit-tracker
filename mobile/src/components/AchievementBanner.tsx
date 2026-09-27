import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { Award, Sparkles, Trophy, Check } from "lucide-react-native";
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { hapticSuccess, hapticLight } from "../utils/haptics";
import type { AchievementItem } from "../services/api";

export interface AchievementBannerProps {
  visible: boolean;
  mode?: "unlock" | "details";
  achievement: AchievementItem | null;
  onDismiss: () => void;
}

export const AchievementBanner: React.FC<AchievementBannerProps> = ({
  visible,
  mode = "unlock",
  achievement,
  onDismiss
}) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      if (mode === "unlock") hapticSuccess();
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible, achievement, mode, scaleAnim, opacityAnim]);

  if (!achievement) return null;

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "platinum":
        return {
          text: "PLATINUM",
          color: "#C084FC",
          bg: "rgba(192, 132, 252, 0.2)"
        };
      case "gold":
        return {
          text: "GOLD",
          color: "#FBBF24",
          bg: "rgba(251, 191, 36, 0.2)"
        };
      case "silver":
        return {
          text: "SILVER",
          color: "#94A3B8",
          bg: "rgba(148, 163, 184, 0.2)"
        };
      case "bronze":
      default:
        return {
          text: "BRONZE",
          color: "#F59E0B",
          bg: "rgba(245, 158, 11, 0.2)"
        };
    }
  };

  const tierInfo = getTierBadge(achievement.tier);

  const handleClaim = () => {
    hapticLight();
    onDismiss();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Glowing Top Aura */}
          <View style={styles.aura} />

          {/* Badge / Trophy Icon */}
          <View
            style={[styles.iconContainer, { backgroundColor: tierInfo.bg }]}
          >
            {achievement.emoji ? (
              <Text style={styles.emojiText}>{achievement.emoji}</Text>
            ) : (
              <Trophy size={48} color={tierInfo.color} />
            )}
          </View>

          {/* Tier pill */}
          <View style={[styles.tierPill, { backgroundColor: tierInfo.bg }]}>
            <Award size={12} color={tierInfo.color} />
            <Text style={[styles.tierText, { color: tierInfo.color }]}>
              {tierInfo.text} ACHIEVEMENT
            </Text>
          </View>

          {/* Main Title */}
          <Text style={styles.unlockSubtitle}>{mode === "unlock" ? "ACHIEVEMENT UNLOCKED!" : "ACHIEVEMENT DETAILS"}</Text>
          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          {/* XP Bonus */}
          <View style={styles.xpBonusCard}>
            <Sparkles size={16} color={COLORS.xp} />
            <Text style={styles.xpBonusText}>
              {achievement.xpBonus} XP {mode === "unlock" ? "earned" : "already earned"}
            </Text>
          </View>

          {/* Claim Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            onPress={handleClaim}
            style={styles.claimButton}
          >
            <Check size={18} color={COLORS.white} strokeWidth={3} />
            <Text style={styles.claimButtonText}>{mode === "unlock" ? "Continue" : "Done"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 15, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl
  },
  card: {
    width: Math.min(width - 48, 380),
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden"
  },
  aura: {
    position: "absolute",
    top: -50,
    width: 200,
    height: 100,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderRadius: 100
  },
  iconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)"
  },
  emojiText: {
    fontSize: 44
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
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1
  },
  unlockSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 4
  },
  achievementName: {
    ...TYPOGRAPHY.title1,
    textAlign: "center",
    marginBottom: SPACING.xs
  },
  description: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm
  },
  xpBonusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.xpLight,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    gap: 8,
    marginBottom: SPACING.xl
  },
  xpBonusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.xp,
    fontWeight: "700",
    fontSize: 13
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.lg,
    width: "100%",
    gap: 8
  },
  claimButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 15
  }
});
