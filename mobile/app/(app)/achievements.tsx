import { ProgressHeader } from "../../src/components/ProgressHeader";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, Lock, Sparkles, CheckCircle2 } from "lucide-react-native";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS
} from "../../src/constants/theme";
import { gamificationApi, type AchievementItem } from "../../src/services/api";
import { useAchievementStore } from "../../src/stores/achievementStore";

type TierFilter =
  | "all"
  | "unlocked"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum";

export default function AchievementsScreen() {
  const [activeFilter, setActiveFilter] = useState<TierFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const viewAchievement = useAchievementStore((state) => state.viewAchievement);

  const {
    data: achievements = [],
    isLoading,
    isError,
    refetch
  } = useQuery<AchievementItem[]>({
    queryKey: ["achievements"],
    queryFn: gamificationApi.getAchievements
  });

  // The API owns badge IDs, rewards, and unlock status.
  const allBadges = achievements;

  const unlockedCount = allBadges.filter((b) => b.unlocked).length;
  const totalCount = allBadges.length;
  const progressPercent = totalCount ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      if (activeFilter === "unlocked") return badge.unlocked;
      if (activeFilter === "all") return true;
      return badge.tier === activeFilter;
    }).sort((a, b) => Number(b.unlocked) - Number(a.unlocked)
      || (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""));
  }, [allBadges, activeFilter]);

  const filterChips: { key: TierFilter; label: string }[] = [
    { key: "all", label: `All (${totalCount})` },
    { key: "unlocked", label: `Unlocked (${unlockedCount})` },
    { key: "bronze", label: "Bronze" },
    { key: "silver", label: "Silver" },
    { key: "gold", label: "Gold" },
    { key: "platinum", label: "Platinum" }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return {
          border: "#C084FC",
          bg: "rgba(192, 132, 252, 0.15)",
          text: "#C084FC"
        };
      case "gold":
        return {
          border: "#FBBF24",
          bg: "rgba(251, 191, 36, 0.15)",
          text: "#FBBF24"
        };
      case "silver":
        return {
          border: "#94A3B8",
          bg: "rgba(148, 163, 184, 0.15)",
          text: "#94A3B8"
        };
      case "bronze":
      default:
        return {
          border: "#F59E0B",
          bg: "rgba(245, 158, 11, 0.15)",
          text: "#F59E0B"
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Trophy Room</Text>
            <Text style={styles.headerSubtitle}>
              Your milestones, with unlocked badges first
            </Text>
          </View>
        </View>

        {/* Unlocked Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconGroup}>
              <Trophy size={20} color="#FBBF24" />
              <Text style={styles.progressLabel}>Badges Collected</Text>
            </View>
            <Text style={styles.progressValue}>
              {unlockedCount} / {totalCount} ({progressPercent}%)
            </Text>
          </View>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Filter Scroll */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterChips.map((chip) => {
              const isSelected = activeFilter === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  onPress={() => setActiveFilter(chip.key)}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Badges Grid */}
        <ScrollView
          contentContainerStyle={styles.badgeList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : isError ? (
            <View style={styles.loaderContainer}>
              <Text style={styles.headerSubtitle}>Could not load achievements.</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void refetch()} style={styles.filterChip}>
                <Text style={styles.filterChipTextActive}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : filteredBadges.length === 0 ? (
            <Text style={styles.headerSubtitle}>No badges unlocked yet. Keep building your habits to earn your first.</Text>
          ) : (
            filteredBadges.map((badge) => {
              const tier = getTierColor(badge.tier);

              return (
                <TouchableOpacity
                  key={badge.id}
                  activeOpacity={0.8}
                  disabled={!badge.unlocked}
                  accessibilityRole={badge.unlocked ? "button" : "text"}
                  accessibilityLabel={`${badge.name}. ${badge.unlocked ? "View achievement details" : "Locked"}`}
                  onPress={() => {
                    if (badge.unlocked) {
                      viewAchievement(badge);
                    }
                  }}
                  style={[
                    styles.badgeCard,
                    badge.unlocked
                      ? { borderColor: tier.border }
                      : styles.badgeCardLocked
                  ]}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      badge.unlocked
                        ? { backgroundColor: tier.bg }
                        : styles.iconContainerLocked
                    ]}
                  >
                    {badge.unlocked ? (
                      <Text style={styles.badgeEmoji}>{badge.emoji || "🏆"}</Text>
                    ) : (
                      <Lock size={22} color={COLORS.textMuted} />
                    )}
                  </View>

                  <View style={styles.badgeInfo}>
                    <View style={styles.badgeTopRow}>
                      <Text
                        style={[
                          styles.badgeName,
                          !badge.unlocked && styles.badgeNameLocked
                        ]}
                      >
                        {badge.name}
                      </Text>
                      <View
                        style={[
                          styles.tierPill,
                          {
                            backgroundColor: badge.unlocked
                              ? tier.bg
                              : COLORS.surfaceElevated
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.tierPillText,
                            {
                              color: badge.unlocked
                                ? tier.text
                                : COLORS.textMuted
                            }
                          ]}
                        >
                          {badge.tier.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.badgeDescription,
                        !badge.unlocked && styles.badgeDescLocked
                      ]}
                    >
                      {badge.description}
                    </Text>

                    <View style={styles.badgeFooter}>
                      <View style={styles.xpBonus}>
                        <Sparkles size={12} color={COLORS.xp} />
                        <Text style={styles.xpBonusText}>
                          +{badge.xpBonus} XP
                        </Text>
                      </View>

                      {badge.unlocked ? (
                        <View style={styles.unlockedDate}>
                          <CheckCircle2 size={12} color={COLORS.success} />
                          <Text style={styles.unlockedDateText}>
                            {badge.unlockedAt ? `Unlocked` : "Unlocked"}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.lockedText}>Locked</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm
  },
  headerTitle: {
    ...TYPOGRAPHY.title1
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  progressCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm
  },
  progressIconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  progressLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text
  },
  progressValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.textSecondary
  },
  track: {
    height: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 4,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.warning,
    borderRadius: 4
  },
  filterContainer: {
    marginBottom: SPACING.sm
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8
  },
  filterChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: "700"
  },
  badgeList: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md
  },
  loaderContainer: {
    paddingVertical: SPACING.xxxl,
    alignItems: "center"
  },
  badgeCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: SPACING.md
  },
  badgeCardLocked: {
    borderColor: COLORS.border
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center"
  },
  iconContainerLocked: {
    backgroundColor: COLORS.surfaceElevated
  },
  badgeEmoji: {
    fontSize: 26
  },
  badgeInfo: {
    flex: 1
  },
  badgeTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2
  },
  badgeName: {
    flexShrink: 1,
    marginRight: SPACING.sm,
    ...TYPOGRAPHY.title3,
    color: COLORS.text
  },
  badgeNameLocked: {
    color: COLORS.textSecondary
  },
  tierPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.xs
  },
  tierPillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  badgeDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  badgeDescLocked: {
    color: COLORS.textMuted
  },
  badgeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  xpBonus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  xpBonusText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.xp
  },
  unlockedDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  unlockedDateText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: "600"
  },
  lockedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600"
  }
});
