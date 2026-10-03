import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlusCircle } from "lucide-react-native";
import { COLORS, LIST, SPACING, TYPOGRAPHY } from "../../src/constants/theme";
import { ProgressHeader } from "../../src/components/ProgressHeader";
import { HabitRow } from "../../src/components/HabitRow";
import {
  Divider,
  LeadingDot,
  LIST_TEXT_INSET,
  ListRow,
  RowSkeleton,
  SectionLabel
} from "../../src/components/List";
import { Fab, FAB_CLEARANCE } from "../../src/components/Fab";
import { Button } from "../../src/components/Button";
import { ErrorState, Skeleton } from "../../src/components/StateViews";
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
import { formatSchedule, weeklyProgress } from "../../src/utils/format";
import { habitColor } from "../../src/utils/habitColor";
import { hapticError } from "../../src/utils/haptics";
import { dayState, completed } from "@habit-tracker/shared";
import type { HabitListItem, HabitLog, ActionStatus } from "@habit-tracker/shared";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Monday, Sep 29" for YYYY-MM-DD (noon, so no timezone shifts the day). */
const longDate = (date: string) => {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${WEEKDAYS[parsed.getDay()]}, ${MONTHS[parsed.getMonth()]} ${parsed.getDate()}`;
};

const LEGENDARY_BONUS_XP = 25;

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
      Alert.alert("Couldn't save", errorMessage(error));
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

  const openEdit = (habit: HabitListItem) =>
    router.push({ pathname: "/habits/new", params: { editId: habit.id } }, { withAnchor: true });

  const openNewHabit = () => router.push("/habits/new", { withAnchor: true });

  const hasNoHabits = habitsQuery.isSuccess && activeHabits.length === 0;
  // Resting habits without a repair offer: listed quietly under "Not due today".
  const restingOther = activeHabits.filter(
    (h) => !h.streakRepair && dayState(h, h.recentDays ?? [], today, today) === "rest"
  );
  const showSummary = habitsQuery.isSuccess && !hasNoHabits;
  const xpToGo =
    profile && profile.xpNeeded != null ? Math.max(0, profile.xpNeeded - profile.xpIntoLevel) : null;
  const levelText = profile
    ? xpToGo == null
      ? `Level ${profile.level} · Max level`
      : `Level ${profile.level} · ${xpToGo.toLocaleString()} XP to go`
    : null;
  const bonusText = isLegendaryDay
    ? "Legendary Day earned ✓"
    : totalQuests === 0
      ? "Nothing due today. Enjoy the break."
      : totalQuests === 1
        ? `Finish it for a +${LEGENDARY_BONUS_XP} XP Legendary Day bonus`
        : `Finish all ${totalQuests} for a +${LEGENDARY_BONUS_XP} XP Legendary Day bonus`;
  const progress = totalQuests > 0 ? completedQuests / totalQuests : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <View style={styles.container}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, !hasNoHabits && { paddingBottom: FAB_CLEARANCE }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {/* ── Header: date + title ── */}
          <View style={styles.header}>
            <Text style={styles.date} maxFontSizeMultiplier={1.5}>
              {longDate(today)}
            </Text>
            <Text style={styles.title} accessibilityRole="header">
              Today
            </Text>
          </View>

          {/* ── Progress summary: plain text on the background, no box ── */}
          {habitsQuery.isLoading ? (
            <View style={styles.summary} accessible accessibilityLabel="Loading today's progress">
              <Skeleton width={140} height={22} />
              <Skeleton height={4} style={{ marginTop: SPACING.md }} />
            </View>
          ) : showSummary ? (
            <View style={styles.summary}>
              <View
                accessible
                accessibilityLabel={`${
                  totalQuests === 0 ? "Nothing due today" : `${completedQuests} of ${totalQuests} done`
                }. ${levelText ?? ""}. ${bonusText.replace("✓", "")}`}
              >
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryCount} maxFontSizeMultiplier={1.4}>
                    {totalQuests === 0 ? "All clear" : `${completedQuests} of ${totalQuests} done`}
                  </Text>
                  {levelText ? (
                    <Text style={styles.summaryLevel} numberOfLines={1} maxFontSizeMultiplier={1.4}>
                      {levelText}
                    </Text>
                  ) : profileQuery.isLoading ? (
                    <Skeleton width={120} height={14} />
                  ) : null}
                </View>
                {totalQuests > 0 ? (
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.fill,
                        isLegendaryDay && styles.fillDone,
                        { width: `${Math.round(progress * 100)}%` }
                      ]}
                    />
                  </View>
                ) : null}
                <Text style={[styles.bonus, isLegendaryDay && styles.bonusDone]} maxFontSizeMultiplier={1.5}>
                  {bonusText}
                </Text>
              </View>
              {!profile && profileQuery.isError ? (
                <Pressable
                  onPress={() => void profileQuery.refetch()}
                  disabled={profileQuery.isFetching}
                  accessibilityRole="button"
                  accessibilityLabel="Couldn't load your level. Retry"
                  style={styles.inlineRetry}
                >
                  <Text style={styles.inlineRetryText}>
                    {profileQuery.isFetching ? "Loading your level…" : "Couldn't load your level · Retry"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* ── Habit list ── */}
          {habitsQuery.isLoading ? (
            <View style={styles.list}>
              <RowSkeleton />
              <Divider />
              <RowSkeleton />
              <Divider />
              <RowSkeleton />
            </View>
          ) : habitsQuery.isError && !habitsQuery.data ? (
            <ErrorState
              title="Couldn't load today's habits"
              error={habitsQuery.error}
              retrying={habitsQuery.isFetching}
              onRetry={() => void habitsQuery.refetch()}
            />
          ) : hasNoHabits ? (
            <View style={styles.empty}>
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
                  onPress={openNewHabit}
                  fullWidth
                />
                <Button
                  title="How Pulse works"
                  variant="ghost"
                  onPress={openWalkthrough}
                  accessibilityHint="Opens a short introduction to habits, XP and streaks"
                  fullWidth
                />
              </View>
            </View>
          ) : displayHabits.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing due today</Text>
              <Text style={styles.emptyText}>
                Your habits are resting today. Check back tomorrow, or add another habit.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {displayHabits.map((habit, index) => (
                <React.Fragment key={habit.id}>
                  {index > 0 ? <Divider /> : null}
                  <HabitRow
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
                    onEdit={() => openEdit(habit)}
                  />
                </React.Fragment>
              ))}
            </View>
          )}

          {habitsQuery.isSuccess && restingRepairs.length > 0 && (
            <>
              <SectionLabel>Streaks to repair</SectionLabel>
              <View style={styles.list}>
                {restingRepairs.map((habit, index) =>
                  habit.streakRepair ? (
                    <React.Fragment key={habit.id}>
                      {index > 0 ? <Divider /> : null}
                      <ListRow
                        title={habit.title}
                        subtitle={`${formatSchedule(habit)} · not due today`}
                        leading={<LeadingDot color={habitColor(habit.color)} />}
                        chevron
                        onPress={() => openHabit(habit)}
                        accessibilityHint="Opens habit details"
                      />
                      <StreakRepairBanner
                        habitId={habit.id}
                        habitTitle={habit.title}
                        offer={habit.streakRepair}
                        disabled={habitsQuery.isPlaceholderData}
                        inset={LIST_TEXT_INSET}
                        style={styles.repairInline}
                      />
                    </React.Fragment>
                  ) : null
                )}
              </View>
            </>
          )}

          {habitsQuery.isSuccess && restingOther.length > 0 && (
            <>
              <SectionLabel>Not due today</SectionLabel>
              <View style={styles.list}>
                {restingOther.map((habit, index) => {
                  const weekly = weeklyProgress(habit, habit.recentDays ?? [], today);
                  return (
                    <React.Fragment key={habit.id}>
                      {index > 0 ? <Divider /> : null}
                      <ListRow
                        title={habit.title}
                        subtitle={
                          weekly
                            ? `${weekly.done}/${weekly.target} this week · done for the week`
                            : formatSchedule(habit)
                        }
                        leading={<LeadingDot color={habitColor(habit.color)} dimmed />}
                        muted
                        chevron
                        onPress={() => openHabit(habit)}
                        accessibilityHint="Opens habit details"
                      />
                    </React.Fragment>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {!hasNoHabits ? (
          <Fab onPress={openNewHabit} accessibilityLabel="New habit" />
        ) : null}
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
  content: {
    paddingBottom: SPACING.xxxl
  },
  header: {
    paddingHorizontal: LIST.gutter,
    paddingTop: SPACING.lg
  },
  date: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary
  },
  title: {
    ...TYPOGRAPHY.hero,
    marginTop: 2
  },
  summary: {
    paddingHorizontal: LIST.gutter,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    flexWrap: "wrap",
    columnGap: SPACING.md,
    rowGap: 2
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text
  },
  summaryLevel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
    flexShrink: 1
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceElevated,
    overflow: "hidden",
    marginTop: SPACING.md
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.primary
  },
  fillDone: {
    backgroundColor: COLORS.gold
  },
  bonus: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm
  },
  bonusDone: {
    color: COLORS.gold,
    fontWeight: "600"
  },
  inlineRetry: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start"
  },
  inlineRetryText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryText
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.divider
  },
  repairInline: {
    marginTop: -SPACING.sm,
    paddingBottom: SPACING.xs
  },
  empty: {
    paddingHorizontal: LIST.gutter + SPACING.sm,
    paddingVertical: SPACING.xxxl,
    alignItems: "center"
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    textAlign: "center"
  },
  emptyText: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl
  },
  emptyActions: {
    alignSelf: "stretch",
    gap: SPACING.sm
  }
});
