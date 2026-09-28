import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, Sparkles, CheckCircle, PlusCircle, Rocket } from "lucide-react-native";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../src/constants/theme";
import { ProgressHeader } from "../../src/components/ProgressHeader";
import { XPBar } from "../../src/components/XPBar";
import { LevelBadge } from "../../src/components/LevelBadge";
import { HabitCard } from "../../src/components/HabitCard";
import { Card } from "../../src/components/Card";
import { Button } from "../../src/components/Button";
import { CardSkeleton, ErrorState, Skeleton } from "../../src/components/StateViews";
import { StreakRepairBanner } from "../../src/components/StreakRepairBanner";
import {
  errorMessage,
  gamificationApi,
  habitLogApi,
  type GamificationProfile,
  type RewardSummary
} from "../../src/services/api";
import { saveHabitLog } from "../../src/services/habitLogs";
import { useAuthStore } from "../../src/stores/authStore";
import { openWalkthrough } from "../../src/stores/onboardingStore";
import { useRewardCelebration } from "../../src/hooks/useRewardCelebration";
import { habitsListKey, useHabitsList } from "../../src/hooks/useHabitsList";
import { localDateString, useLocalDate } from "../../src/utils/date";
import { hapticError } from "../../src/utils/haptics";
import { dayState, completed } from "@habit-tracker/shared";
import type { HabitListItem, HabitLog, ActionStatus } from "@habit-tracker/shared";

type LogChange =
  | { kind: "save"; status: ActionStatus | null; value: number | null }
  | { kind: "delete" };

type LogVariables = { habit: HabitListItem; date: string; logId?: string; change: LogChange };

/** Applies a log change to one habit in the cached list (optimistic UI). */
const applyChange = (
  habit: HabitListItem,
  date: string,
  change: LogChange,
  saved?: HabitLog
): HabitListItem => {
  const now = new Date().toISOString();
  const log: HabitLog | null =
    change.kind === "delete"
      ? null
      : saved ?? {
          ...(habit.selectedDateLog ?? {
            id: `pending-${habit.id}`,
            habitId: habit.id,
            createdAt: now
          }),
          date,
          status: change.status,
          value: change.value,
          updatedAt: now
        };
  const recentDays = (habit.recentDays ?? []).map((day) =>
    day.date === date
      ? { date, status: log?.status ?? null, value: log?.value ?? null, hasLog: Boolean(log) }
      : day
  );
  return { ...habit, selectedDateLog: log, recentDays };
};

export default function TodayScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const celebrate = useRewardCelebration();
  const user = useAuthStore((state) => state.user);
  const today = useLocalDate();
  const listKey = habitsListKey(today);
  const [refreshing, setRefreshing] = useState(false);
  // In-flight habit ids. The ref is the source of truth so every closure
  // (debounced stepper commits, alerts) sees current values; the state copy
  // only drives rendering.
  const savingRef = useRef<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
  const [floats, setFloats] = useState<Record<string, { xp: number; trigger: number }>>({});
  const floatTimers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = floatTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  /** Drops a finished XP float so a remounted card does not replay it. */
  const clearFloat = (habitId: string, trigger: number) =>
    setFloats((current) => {
      if (current[habitId]?.trigger !== trigger) return current;
      const next = { ...current };
      delete next[habitId];
      return next;
    });

  const profileQuery = useQuery<GamificationProfile>({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile
  });
  const profile = profileQuery.data;
  const habitsQuery = useHabitsList(today);
  const habits = habitsQuery.data ?? [];

  // Skipped habits stay visible so they can be undone; weekly habits whose
  // quota is met rest today.
  const activeHabits = habits.filter((h) => !h.archived && h.type !== "expense");
  const displayHabits = activeHabits.filter(
    (h) => dayState(h, h.recentDays ?? [], today, today) !== "rest"
  );
  // Habits resting today are hidden above, but a broken streak can still be repaired.
  const restingRepairs = activeHabits.filter(
    (h) => h.streakRepair && dayState(h, h.recentDays ?? [], today, today) === "rest"
  );
  const challengeHabits = displayHabits.filter(
    (h) => dayState(h, h.recentDays ?? [], today, today) !== "skipped"
  );
  const totalQuests = challengeHabits.length;
  const completedQuests = challengeHabits.filter((h) =>
    completed(h, h.selectedDateLog ?? undefined)
  ).length;
  const isLegendaryDay = totalQuests > 0 && completedQuests === totalQuests;

  const setSaving = (habitId: string, saving: boolean) => {
    if (saving) savingRef.current.add(habitId);
    else savingRef.current.delete(habitId);
    setSavingIds(new Set(savingRef.current));
  };

  const patchHabit = (key: readonly unknown[], habitId: string, update: (habit: HabitListItem) => HabitListItem) =>
    queryClient.setQueryData<HabitListItem[]>(key, (list) =>
      list?.map((habit) => (habit.id === habitId ? update(habit) : habit))
    );

  const logMutation = useMutation({
    mutationFn: async ({ habit, date, logId, change }: LogVariables) => {
      if (change.kind === "delete") {
        if (!logId) return { reward: null as RewardSummary | null, log: undefined };
        const { reward } = await habitLogApi.delete(habit.id, logId);
        return { reward, log: undefined };
      }
      const log = await saveHabitLog(queryClient, habit.id, logId, {
        date,
        status: change.status,
        value: change.value
      });
      return { reward: log.reward ?? null, log };
    },
    onMutate: async ({ habit, date, change }) => {
      const key = habitsListKey(date);
      setSaving(habit.id, true);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient
        .getQueryData<HabitListItem[]>(key)
        ?.find((item) => item.id === habit.id);
      patchHabit(key, habit.id, (item) => applyChange(item, date, change));
      return { previous, key, userId: useAuthStore.getState().user?.id };
    },
    onError: (error, { habit }, context) => {
      // Roll back only this habit so other in-flight cards keep their state.
      if (context?.previous) patchHabit(context.key, habit.id, () => context.previous!);
      void hapticError();
      Alert.alert("Couldn't save your quest", errorMessage(error));
    },
    onSuccess: ({ reward, log }, { habit, date, change }, context) => {
      if (context?.userId !== useAuthStore.getState().user?.id) return;
      if (log) patchHabit(context.key, habit.id, (item) => applyChange(item, date, change, log));
      celebrate(reward);
      const xp = reward?.xpAwarded ?? 0;
      if (xp !== 0) {
        const trigger = Date.now();
        setFloats((current) => ({ ...current, [habit.id]: { xp, trigger } }));
        // Fallback if the animation is interrupted (card unmounted).
        const timer = setTimeout(() => {
          floatTimers.current.delete(timer);
          clearFloat(habit.id, trigger);
        }, 2000);
        floatTimers.current.add(timer);
      }
    },
    onSettled: (_data, _error, { habit }) => {
      setSaving(habit.id, false);
      void queryClient.invalidateQueries({ queryKey: ["habits"] });
      void queryClient.invalidateQueries({ queryKey: ["habitLogs", habit.id] });
      void queryClient.invalidateQueries({ queryKey: ["habitStats", habit.id] });
    }
  });

  /**
   * The log date is taken at tap time (or the first tap of a stepper burst),
   * never from a stale cached "today". Returns false if not started.
   */
  const mutateLog = (habit: HabitListItem, change: LogChange, tapDate?: string) => {
    if (savingRef.current.has(habit.id) || !useAuthStore.getState().user) return false;
    const date = tapDate ?? localDateString();
    // Only reuse the cached log when it is for this exact day (placeholder
    // data from yesterday must never be patched into today).
    const cachedLog = habit.selectedDateLog;
    const logId =
      cachedLog && cachedLog.date === date && !cachedLog.id.startsWith("pending-")
        ? cachedLog.id
        : undefined;
    // Mark in flight synchronously: onMutate runs a microtask later.
    setSaving(habit.id, true);
    logMutation.mutate({ habit, date, logId, change });
    return true;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([profileQuery.refetch(), habitsQuery.refetch()]);
    setRefreshing(false);
  }, [profileQuery, habitsQuery]);

  // withAnchor keeps the Habits list under the pushed screen
  // (initialRouteName), so Back from details stays in the Habits tab.
  const openHabit = (habit: HabitListItem, focusNote = false) =>
    router.push(
      {
        pathname: "/habits/[id]",
        params: focusNote ? { id: habit.id, focusNote: "1" } : { id: habit.id }
      },
      { withAnchor: true }
    );

  const handleComplete = (habit: HabitListItem) => {
    if (habit.requireCompletionComment) {
      openHabit(habit, true);
      return;
    }
    mutateLog(habit, { kind: "save", status: "done", value: null });
  };

  const hasNoHabits = habitsQuery.isSuccess && activeHabits.length === 0;
  const name = user?.email.split("@")[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Hero ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroGreeting}>Welcome back{name ? "," : ""}</Text>
          {name ? (
            <Text style={styles.heroUsername} numberOfLines={1}>
              {name}
            </Text>
          ) : null}
          {profileQuery.isLoading ? (
            <View style={styles.heroSkeleton} accessible accessibilityLabel="Loading your level">
              <Skeleton width={140} height={26} radius={13} />
              <Skeleton height={10} style={{ marginTop: SPACING.md }} />
            </View>
          ) : profile ? (
            <>
              <View style={styles.levelRow}>
                <LevelBadge level={profile.level} title={profile.levelTitle} size="md" />
              </View>
              <XPBar
                currentXP={profile.xpIntoLevel}
                neededXP={profile.xpNeeded}
                level={profile.level}
                title={profile.levelTitle}
                showDetails
              />
            </>
          ) : (
            <ErrorState
              compact
              title="Couldn't load your level"
              error={profileQuery.error}
              retrying={profileQuery.isFetching}
              onRetry={() => void profileQuery.refetch()}
            />
          )}
        </View>

        {/* ── Legendary Day banner (only once the user has habits) ── */}
        {habitsQuery.isSuccess && !hasNoHabits && (
          <View
            style={[styles.challengeBanner, isLegendaryDay && styles.challengeBannerLegendary]}
            accessible
            accessibilityLabel={
              isLegendaryDay
                ? "Legendary Day! All of today's quests are done."
                : totalQuests === 0
                  ? "All clear today. No quests are due."
                  : `${completedQuests} of ${totalQuests} quests done. Finish them all for the Legendary Day bonus.`
            }
          >
            <View style={styles.challengeIconContainer}>
              {isLegendaryDay ? (
                <Trophy size={26} color={COLORS.gold} />
              ) : (
                <Sparkles size={24} color={COLORS.primaryText} />
              )}
            </View>
            <View style={styles.challengeTextContainer}>
              <Text style={styles.challengeTitle}>
                {isLegendaryDay ? "Legendary Day!" : totalQuests === 0 ? "All clear today" : "Legendary Day bonus"}
              </Text>
              <Text style={styles.challengeSubtitle}>
                {isLegendaryDay
                  ? "Every quest done today. +25 XP bonus earned 🏆"
                  : totalQuests === 0
                    ? "No quests are due today. Enjoy the break."
                    : `Finish ${totalQuests === 1 ? "today's quest" : `all ${totalQuests} quests`} to earn +25 XP.`}
              </Text>
              {totalQuests > 0 && (
                <View style={styles.challengeProgressRow}>
                  <View style={styles.miniTrack}>
                    <View
                      style={[
                        styles.miniFill,
                        isLegendaryDay && styles.miniFillDone,
                        { width: `${Math.round((completedQuests / totalQuests) * 100)}%` }
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
        )}

        {/* ── Today's Quests ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Today's Quests
            </Text>
            {habitsQuery.isSuccess && !hasNoHabits && (
              <Text style={styles.sectionSubtitle}>
                {displayHabits.length} {displayHabits.length === 1 ? "habit" : "habits"} due today
              </Text>
            )}
          </View>
          {!hasNoHabits && (
            <TouchableOpacity
              style={styles.addHabitButton}
              accessibilityRole="button"
              accessibilityLabel="New habit"
              onPress={() => router.push("/habits/new", { withAnchor: true })}
            >
              <PlusCircle size={18} color={COLORS.primaryText} />
              <Text style={styles.addHabitText}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {habitsQuery.isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton lines={1} />
          </>
        ) : habitsQuery.isError && !habitsQuery.data ? (
          <Card>
            <ErrorState
              title="Couldn't load today's quests"
              error={habitsQuery.error}
              retrying={habitsQuery.isFetching}
              onRetry={() => void habitsQuery.refetch()}
            />
          </Card>
        ) : hasNoHabits ? (
          <Card style={styles.emptyCard}>
            <Rocket size={44} color={COLORS.primaryText} />
            <Text style={styles.emptyTitle} accessibilityRole="header">
              Add your first habit to start your streak 🔥
            </Text>
            <Text style={styles.emptyText}>
              Each day you complete it you earn XP, grow your streak and unlock badges in the Trophy Room.
            </Text>
            <View style={styles.emptyActions}>
              <Button
                title="Create a habit"
                icon={<PlusCircle size={16} color={COLORS.white} />}
                onPress={() => router.push("/habits/new", { withAnchor: true })}
                fullWidth
              />
              <Button
                title="How Pulse works"
                variant="secondary"
                onPress={openWalkthrough}
                accessibilityHint="Opens a short introduction to habits, XP and streaks"
                fullWidth
              />
            </View>
          </Card>
        ) : displayHabits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CheckCircle size={44} color={COLORS.success} />
            <Text style={styles.emptyTitle}>Nothing due today</Text>
            <Text style={styles.emptyText}>
              Your habits are resting today. Check back tomorrow, or add another habit.
            </Text>
            <Button title="New habit" variant="secondary" onPress={() => router.push("/habits/new", { withAnchor: true })} />
          </Card>
        ) : (
          displayHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              date={today}
              // Yesterday's list shown while the new day loads: read-only.
              saving={savingIds.has(habit.id) || habitsQuery.isPlaceholderData}
              xpFloat={floats[habit.id] ?? null}
              onXpFloatDone={() => {
                const float = floats[habit.id];
                if (float) clearFloat(habit.id, float.trigger);
              }}
              onComplete={() => handleComplete(habit)}
              onSkip={() => mutateLog(habit, { kind: "save", status: "skipped", value: null })}
              onUndo={() => mutateLog(habit, { kind: "delete" })}
              onSaveMeasurable={(value, date) =>
                mutateLog(habit, { kind: "save", status: null, value }, date)
              }
              onPressCard={() => openHabit(habit)}
            />
          ))
        )}

        {habitsQuery.isSuccess && restingRepairs.length > 0 && (
          <View style={styles.repairSection}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Streaks to repair
            </Text>
            {restingRepairs.map((habit) =>
              habit.streakRepair ? (
                <Card key={habit.id} style={styles.repairCard}>
                  <TouchableOpacity
                    onPress={() => openHabit(habit)}
                    accessibilityRole="button"
                    accessibilityHint="Opens habit details"
                  >
                    <Text style={styles.repairTitle} numberOfLines={1}>
                      {habit.title}
                    </Text>
                  </TouchableOpacity>
                  <StreakRepairBanner
                    habitId={habit.id}
                    habitTitle={habit.title}
                    offer={habit.streakRepair}
                    disabled={habitsQuery.isPlaceholderData}
                  />
                </Card>
              ) : null
            )}
          </View>
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
    marginBottom: SPACING.md
  },
  heroGreeting: {
    ...TYPOGRAPHY.caption
  },
  heroUsername: {
    ...TYPOGRAPHY.title1,
    marginBottom: SPACING.md
  },
  heroSkeleton: {
    marginTop: SPACING.sm
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
    backgroundColor: COLORS.goldLight,
    borderColor: COLORS.goldBorder
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
    ...TYPOGRAPHY.title3
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
  miniFillDone: {
    backgroundColor: COLORS.gold
  },
  challengeProgressText: {
    ...TYPOGRAPHY.micro,
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
    ...TYPOGRAPHY.caption
  },
  addHabitButton: {
    flexShrink: 0,
    minHeight: 44,
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  addHabitText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primaryText
  },
  repairSection: {
    marginTop: SPACING.md,
    gap: SPACING.sm
  },
  repairCard: {
    paddingBottom: SPACING.xs
  },
  repairTitle: {
    ...TYPOGRAPHY.title3,
    marginBottom: SPACING.sm
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    marginTop: SPACING.md,
    textAlign: "center",
    paddingHorizontal: SPACING.md
  },
  emptyActions: {
    alignSelf: "stretch",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md
  },
  emptyText: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md
  }
});
