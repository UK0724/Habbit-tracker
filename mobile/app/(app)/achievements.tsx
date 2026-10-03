import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  useWindowDimensions
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { ChevronRight, Lock } from "lucide-react-native";
import {
  BORDER_RADIUS,
  COLORS,
  SPACING,
  TIER_COLORS,
  TYPOGRAPHY,
  tierColors,
  type Tier
} from "../../src/constants/theme";
import { ProgressHeader } from "../../src/components/ProgressHeader";
import { ErrorState, Skeleton } from "../../src/components/StateViews";
import { gamificationApi, type AchievementItem } from "../../src/services/api";
import { useCelebrationStore } from "../../src/stores/achievementStore";
import { shortDate } from "../../src/utils/date";

type Filter = "all" | "unlocked" | "locked";

const TIERS: Tier[] = ["bronze", "silver", "gold", "platinum"];
const CATEGORY_ORDER = ["beginner", "streak", "consistency", "performance", "levels", "special", "other"] as const;
const CATEGORY_LABEL: Record<(typeof CATEGORY_ORDER)[number], string> = {
  beginner: "Getting started",
  streak: "Streaks",
  consistency: "Consistency",
  performance: "Performance",
  levels: "Levels",
  special: "Special",
  other: "More badges"
};

const RIPPLE = { color: "rgba(255, 255, 255, 0.08)" } as const;

const rewardText = (badge: AchievementItem) =>
  `+${badge.xpBonus} XP${badge.gemBonus ? ` · +${badge.gemBonus} 💎` : ""}`;

function ProgressRing({ unlocked, total }: { unlocked: number; total: number }) {
  const size = 104;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total ? unlocked / total : 0;
  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${unlocked} of ${total} badges unlocked`}
      accessibilityValue={{ min: 0, max: total, now: unlocked }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={COLORS.surfaceElevated} strokeWidth={stroke} fill="none" />
        {progress > 0 && <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.gold}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />}
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Text style={styles.ringValue} maxFontSizeMultiplier={1.2}>
          {unlocked}/{total}
        </Text>
        <Text style={styles.ringLabel} maxFontSizeMultiplier={1.2}>
          badges
        </Text>
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const viewAchievement = useCelebrationStore((state) => state.viewAchievement);
  const { width, fontScale } = useWindowDimensions();
  const columns = fontScale > 1.35 ? 1 : 2;
  const tileWidth = (width - SPACING.lg * 2 - SPACING.sm * (columns - 1)) / columns;

  const { data: achievements = [], isLoading, isError, error, refetch, isFetching } = useQuery<AchievementItem[]>({
    queryKey: ["achievements"],
    queryFn: gamificationApi.getAchievements
  });

  const unlockedCount = achievements.filter((b) => b.unlocked).length;
  const tierCounts = TIERS.map((tier) => ({
    tier,
    unlocked: achievements.filter((b) => b.tier === tier && b.unlocked).length,
    total: achievements.filter((b) => b.tier === tier).length
  })).filter((entry) => entry.total > 0);

  const nextUp = useMemo(
    () =>
      achievements
        .filter((b) => !b.unlocked && (b.tier === "bronze" || b.tier === "silver"))
        .sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.xpBonus - b.xpBonus)
        .slice(0, 2),
    [achievements]
  );

  const sections = useMemo(() => {
    const visible = achievements.filter((badge) =>
      filter === "all" ? true : filter === "unlocked" ? badge.unlocked : !badge.unlocked
    );
    return CATEGORY_ORDER.map((category) => ({
      category,
      badges: visible
        .filter((badge) => (badge.category && badge.category in CATEGORY_LABEL ? badge.category : "other") === category)
        .sort(
          (a, b) =>
            Number(Boolean(b.unlocked)) - Number(Boolean(a.unlocked)) ||
            TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier)
        )
    })).filter((section) => section.badges.length > 0);
  }, [achievements, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${achievements.length})` },
    { key: "unlocked", label: `Unlocked (${unlockedCount})` },
    { key: "locked", label: `Locked (${achievements.length - unlockedCount})` }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={styles.headerTitle} accessibilityRole="header">
          Trophy Room
        </Text>
        <Text style={styles.headerSubtitle}>Every badge you've earned, and what's next. Tap any badge for details.</Text>

        {isLoading ? (
          <View style={styles.loading} accessible accessibilityLabel="Loading badges">
            <Skeleton height={140} radius={BORDER_RADIUS.lg} />
            <View style={styles.grid}>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} width={tileWidth} height={150} radius={BORDER_RADIUS.lg} />
              ))}
            </View>
          </View>
        ) : isError ? (
          <View>
            <ErrorState
              title="Couldn't load your badges"
              error={error}
              retrying={isFetching}
              onRetry={() => void refetch()}
            />
          </View>
        ) : (
          <>
            {/* Hero */}
            <View style={styles.heroCard}>
              <ProgressRing unlocked={unlockedCount} total={achievements.length} />
              <View style={styles.tierList}>
                {tierCounts.map(({ tier, unlocked, total }) => (
                  <View
                    key={tier}
                    style={styles.tierRow}
                    accessible
                    accessibilityLabel={`${tier}: ${unlocked} of ${total}`}
                  >
                    <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[tier].border }]} />
                    <Text style={styles.tierName}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Text>
                    <Text style={[styles.tierCount, { color: TIER_COLORS[tier].fg }]}>
                      {unlocked}/{total}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Next up */}
            {nextUp.length > 0 && (
              <View style={styles.nextUp}>
                <Text style={[styles.sectionTitle, styles.nextUpTitle]} accessibilityRole="header">
                  Next up
                </Text>
                {nextUp.map((badge, index) => (
                  <Pressable
                    key={badge.id}
                    style={({ pressed }) => [styles.nextRow, index > 0 && styles.nextRowDivider, pressed && styles.pressed]}
                    android_ripple={RIPPLE}
                    accessibilityRole="button"
                    accessibilityLabel={`Next up: ${badge.name}. ${badge.description}. Reward ${rewardText(badge)}`}
                    onPress={() => viewAchievement(badge)}
                  >
                    <Text style={styles.nextEmoji}>{badge.emoji || "🏆"}</Text>
                    <View style={styles.nextCopy}>
                      <Text style={styles.nextName}>{badge.name}</Text>
                      <Text style={styles.nextDesc}>{badge.description}</Text>
                      <Text style={styles.nextReward}>{rewardText(badge)}</Text>
                    </View>
                    <ChevronRight size={20} color={COLORS.textMuted} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {filters.map((chip) => {
                const selected = filter === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(chip.key)}
                    android_ripple={RIPPLE}
                    hitSlop={4}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{chip.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {sections.length === 0 ? (
              <Text style={styles.emptyText}>
                {filter === "unlocked"
                  ? "No badges yet. Complete today's quests to earn your first."
                  : filter === "locked"
                    ? "You've unlocked every badge. Legendary!"
                    : "No badges to show yet. Pull down to refresh."}
              </Text>
            ) : (
              sections.map(({ category, badges }) => (
                <View key={category} style={styles.section}>
                  <Text style={styles.sectionTitle} accessibilityRole="header">
                    {CATEGORY_LABEL[category]}
                  </Text>
                  <View style={styles.grid}>
                    {badges.map((badge) => {
                      const tier = tierColors(badge.tier);
                      const locked = !badge.unlocked;
                      const unlockedOn = shortDate(badge.unlockedAt);
                      return (
                        <Pressable
                          key={badge.id}
                          android_ripple={RIPPLE}
                          accessibilityRole="button"
                          accessibilityLabel={`${badge.name}, ${badge.tier}. ${
                            locked ? `Locked. ${badge.description}` : `Unlocked${unlockedOn ? ` ${unlockedOn}` : ""}`
                          }. Reward ${rewardText(badge)}`}
                          accessibilityHint={locked ? "Shows how to unlock" : "Shows details"}
                          onPress={() => viewAchievement(badge)}
                          style={({ pressed }) => [styles.tile, { width: tileWidth }, pressed && styles.pressed]}
                        >
                          <View style={[styles.tileIcon, { backgroundColor: locked ? COLORS.surfaceElevated : tier.bg }]}>
                            <Text style={[styles.tileEmoji, locked && styles.tileEmojiLocked]}>{badge.emoji || "🏆"}</Text>
                            {locked && (
                              <View style={styles.lockOverlay}>
                                <Lock size={12} color={COLORS.text} />
                              </View>
                            )}
                          </View>
                          <Text style={[styles.tileName, locked && styles.tileNameLocked]}>{badge.name}</Text>
                          <Text style={[styles.tierText, { color: locked ? COLORS.textMuted : tier.fg }]}>
                            {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)} · {rewardText(badge)}
                          </Text>
                          <Text style={[styles.tileStatus, !locked && styles.tileStatusUnlocked]}>
                            {locked ? "Locked · tap for how" : unlockedOn ? `Unlocked ${unlockedOn}` : "Unlocked"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl
  },
  headerTitle: {
    ...TYPOGRAPHY.title1
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md
  },
  loading: {
    gap: SPACING.md
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.xxl,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  ringValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text
  },
  ringLabel: {
    ...TYPOGRAPHY.micro
  },
  tierList: {
    flex: 1,
    minWidth: 140,
    gap: SPACING.sm
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  tierName: {
    ...TYPOGRAPHY.body,
    flex: 1
  },
  tierCount: {
    ...TYPOGRAPHY.label
  },
  nextUp: {
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.lg
  },
  nextUpTitle: {
    paddingHorizontal: SPACING.lg
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
    minHeight: 64,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md
  },
  nextRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border
  },
  nextReward: {
    ...TYPOGRAPHY.caption,
    color: COLORS.xpText,
    marginTop: 2
  },
  pressed: {
    opacity: 0.85
  },
  nextEmoji: {
    fontSize: 26,
    opacity: 0.6
  },
  nextCopy: {
    flex: 1
  },
  nextName: {
    ...TYPOGRAPHY.body,
    fontWeight: "700"
  },
  nextDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  filterScroll: {
    gap: 8,
    paddingBottom: SPACING.md
  },
  filterChip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden"
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: COLORS.primaryText,
    fontWeight: "700"
  },
  emptyText: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    paddingVertical: SPACING.xl
  },
  section: {
    marginBottom: SPACING.lg
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    marginBottom: SPACING.sm
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm
  },
  tile: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    gap: 6
  },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  tileEmoji: {
    fontSize: 28
  },
  tileEmojiLocked: {
    opacity: 0.3
  },
  lockOverlay: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center"
  },
  tileName: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    textAlign: "center"
  },
  tileNameLocked: {
    color: COLORS.textSecondary
  },
  tierText: {
    ...TYPOGRAPHY.caption,
    textAlign: "center"
  },
  reward: {
    ...TYPOGRAPHY.micro,
    fontWeight: "700",
    color: COLORS.xpText,
    textAlign: "center"
  },
  tileStatus: {
    ...TYPOGRAPHY.micro,
    textAlign: "center"
  },
  tileStatusUnlocked: {
    color: COLORS.success
  }
});
