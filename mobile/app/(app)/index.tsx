import { ProgressHeader } from "../../src/components/ProgressHeader";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Trophy,
  Sparkles,
  CheckCircle,
  PlusCircle
} from "lucide-react-native";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS
} from "../../src/constants/theme";
import { XPBar } from "../../src/components/XPBar";
import { LevelBadge } from "../../src/components/LevelBadge";
import { HabitCard } from "../../src/components/HabitCard";
import { Card } from "../../src/components/Card";
import {
  habitApi,
  habitLogApi,
  gamificationApi,
  type GamificationProfile
} from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";
import { useAchievementStore } from "../../src/stores/achievementStore";
import { getTodayDateString, dayState, completed } from "@habit-tracker/shared";
import type { HabitListItem, ActionStatus } from "@habit-tracker/shared";

export default function TodayScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const showAchievement = useAchievementStore((state) => state.showAchievement);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch Profile / Gamification stats
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile
  } = useQuery<GamificationProfile>({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile
  });

  const today = profile?.today ?? getTodayDateString();

  // 2. Fetch Habits with today's log status
  const {
    data: habits = [],
    isLoading: isHabitsLoading,
    refetch: refetchHabits
  } = useQuery<HabitListItem[]>({
    queryKey: ["habits", "today"],
    queryFn: () => habitApi.list()
  });

  // Keep skipped habits visible so they can be undone, while weekly habits
  // whose quota was already met can rest today.
  const activeHabits = habits.filter((h) => !h.archived);
  const displayHabits = activeHabits.filter(
    (h) => dayState(h, h.recentDays, today, today) !== "rest"
  );
  const challengeHabits = displayHabits.filter(
    (h) => dayState(h, h.recentDays, today, today) !== "skipped"
  );

  // Calculate Quest Completion stats
  const totalQuests = challengeHabits.length;
  const completedQuests = challengeHabits.filter((h) =>
    completed(h, h.selectedDateLog ?? undefined)
  ).length;

  const isLegendaryDay = totalQuests > 0 && completedQuests === totalQuests;

  // Log Habit Mutation
  const saveLogMutation = useMutation({
    mutationFn: async ({
      habitId,
      logId,
      payload
    }: {
      habitId: string;
      logId?: string;
      payload: {
        date: string;
        status?: ActionStatus | null;
        value?: number | null;
      };
    }) => {
      const userId = useAuthStore.getState().user?.id;
      // Compare with a fresh baseline, never with every badge earned today.
      // An unavailable baseline must not prevent saving the habit.
      const before = await gamificationApi.getAchievements().catch(() => null);
      if (logId) await habitLogApi.update(habitId, logId, payload);
      else await habitLogApi.create(habitId, payload);
      return { before, userId };
    },
    onError: (error) => Alert.alert("Could not save habit", error.message),
    onSuccess: async ({ before, userId }) => {
      if (userId !== useAuthStore.getState().user?.id) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["habits"] }),
        queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["achievements"] })
      ]);

      // Check if new achievements were unlocked
      try {
        if (!before) return;
        const achievements = await gamificationApi.getAchievements();
        if (userId !== useAuthStore.getState().user?.id) return;
        const previouslyUnlocked = new Set(before.filter((a) => a.unlocked).map((a) => a.id));
        achievements.filter((a) => a.unlocked && !previouslyUnlocked.has(a.id)).forEach(showAchievement);
      } catch {
        // ignore
      }
    }
  });

  const undoSkipMutation = useMutation({
    mutationFn: ({ habitId, logId }: { habitId: string; logId: string }) =>
      habitLogApi.delete(habitId, logId),
    onError: (error) => Alert.alert("Could not undo skip", error.message),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["habits"] }),
        queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] }),
        queryClient.invalidateQueries({ queryKey: ["achievements"] })
      ]);
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchHabits()]);
    setRefreshing(false);
  };

  const handleActionComplete = (habit: HabitListItem, status: ActionStatus) => {
    if (habit.requireCompletionComment && status === "done") {
      router.push(`/habits/${habit.id}`);
      return;
    }
    const logId = habit.selectedDateLog?.id;
    saveLogMutation.mutate({
      habitId: habit.id,
      logId,
      payload: {
        date: today,
        status,
        value: null
      }
    });
  };

  const handleMeasurableSave = (habit: HabitListItem, value: number) => {
    const logId = habit.selectedDateLog?.id;
    saveLogMutation.mutate({
      habitId: habit.id,
      logId,
      payload: {
        date: today,
        status: null,
        value
      }
    });
  };

  const handleUndoSkip = (habit: HabitListItem) => {
    const logId = habit.selectedDateLog?.id;
    if (logId) undoSkipMutation.mutate({ habitId: habit.id, logId });
  };

  const isLoading = isProfileLoading || isHabitsLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ── Top Gamer Hero Section ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroUserSection}>
              <Text style={styles.heroGreeting}>Welcome back,</Text>
              <Text style={styles.heroUsername} numberOfLines={1}>
                {user?.email.split("@")[0] || "Hero"}
              </Text>
            </View>
          </View>

          {/* Level Badge + XP Progress Bar */}
          <View style={styles.levelRow}>
            <LevelBadge
              level={profile?.level ?? 1}
              title={profile?.levelTitle ?? "Novice"}
              size="md"
            />
          </View>

          <XPBar
            currentXP={profile?.xpIntoLevel ?? 0}
            neededXP={profile?.xpNeeded ?? 100}
            level={profile?.level ?? 1}
            title={profile?.levelTitle}
            showDetails
          />
        </View>

        {/* ── Daily Challenge / Legendary Day Banner ── */}
        <View
          style={[
            styles.challengeBanner,
            isLegendaryDay && styles.challengeBannerLegendary
          ]}
        >
          <View style={styles.challengeIconContainer}>
            {isLegendaryDay ? (
              <Trophy size={26} color="#FBBF24" />
            ) : (
              <Sparkles size={24} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.challengeTextContainer}>
            <Text style={styles.challengeTitle}>
              {isLegendaryDay
                ? "Legendary Day Achieved!"
                : totalQuests === 0
                  ? "All clear today"
                  : "Today's Daily Challenge"}
            </Text>
            <Text style={styles.challengeSubtitle}>
              {isLegendaryDay
                ? "All daily quests finished! +25 XP Bonus awarded 🏆"
                : totalQuests === 0
                  ? "No habits are due today. Enjoy the break."
                  : `Complete ${totalQuests === 1 ? "the" : `all ${totalQuests}`} quest${totalQuests === 1 ? "" : "s"} to unlock the +25 XP Legendary Day bonus.`}
            </Text>
            {totalQuests > 0 && (
              <View style={styles.challengeProgressRow}>
                <View style={styles.miniTrack}>
                  <View
                    style={[
                      styles.miniFill,
                      {
                        width: `${Math.round(
                          (completedQuests / totalQuests) * 100
                        )}%`
                      }
                    ]}
                  />
                </View>
                <Text style={styles.challengeProgressText}>
                  {completedQuests} / {totalQuests}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Section Title: Today's Quests ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Daily Quests</Text>
            <Text style={styles.sectionSubtitle}>
              {displayHabits.length} {displayHabits.length === 1 ? "habit" : "habits"} scheduled today
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addHabitButton}
            onPress={() => router.push("/habits/new")}
          >
            <PlusCircle size={18} color={COLORS.primary} />
            <Text style={styles.addHabitText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quest Cards List ── */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : displayHabits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CheckCircle size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Quests for Today</Text>
            <Text style={styles.emptyText}>
              Create your first habit or adjust your schedules to start earning
              XP!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/habits/new")}
            >
              <Text style={styles.emptyButtonText}>Create New Habit</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          displayHabits.map((habit) => {
            const streak =
              habit.stats?.type === "action" ? habit.stats.currentStreak : 0;

            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                todayLog={habit.selectedDateLog}
                date={today}
                streak={streak}
                onCompleteAction={(status) =>
                  handleActionComplete(habit, status)
                }
                onSaveMeasurable={(val) => handleMeasurableSave(habit, val)}
                onUndoSkip={() => handleUndoSkip(habit)}
                onPressCard={() => router.push(`/habits/${habit.id}`)}
                isLoading={
                  saveLogMutation.isPending || undoSkipMutation.isPending
                }
              />
            );
          })
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
  container: {
    flex: 1
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxl
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md
  },
  heroUserSection: {
    flex: 1,
    marginRight: SPACING.sm
  },
  heroGreeting: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  heroUsername: {
    ...TYPOGRAPHY.title1,
    color: COLORS.text
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  gemsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gemLight,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.4)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.full,
    gap: 4
  },
  gemsText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gem
  },
  levelRow: {
    marginBottom: SPACING.md
  },
  challengeBanner: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.lg,
    gap: SPACING.md
  },
  challengeBannerLegendary: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.4)"
  },
  challengeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center"
  },
  challengeTextContainer: {
    flex: 1
  },
  challengeTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.text
  },
  challengeSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  challengeProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8
  },
  miniTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden"
  },
  miniFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3
  },
  challengeProgressText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700"
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },
  sectionHeading: {
    flex: 1,
    minWidth: 0
  },
  sectionTitle: {
    ...TYPOGRAPHY.title2
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  addHabitButton: {
    flexShrink: 0,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  addHabitText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.primary
  },
  loaderContainer: {
    paddingVertical: SPACING.xxxl,
    alignItems: "center"
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    marginTop: SPACING.md,
    color: COLORS.text
  },
  emptyText: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14
  }
});
