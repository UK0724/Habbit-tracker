import { useState, useEffect } from "react";
import { Input } from "../../../src/components/Input";
import { completed } from "@habit-tracker/shared";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Archive,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  Target,
  Pencil
} from "lucide-react-native";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS
} from "../../../src/constants/theme";
import { Card } from "../../../src/components/Card";
import { Button } from "../../../src/components/Button";
import { StreakBadge } from "../../../src/components/StreakBadge";
import { habitColor } from "../../../src/utils/habitColor";
import {
  habitApi,
  habitLogApi,
  gamificationApi
} from "../../../src/services/api";
import { formatDateLabel } from "@habit-tracker/shared";
import { hapticSuccess, hapticLight } from "../../../src/utils/haptics";
import type { HabitLog, ActionStatus } from "@habit-tracker/shared";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile
  });
  const today = profile?.today ?? "";
  const [valueInput, setValueInput] = useState("");
  const [comment, setComment] = useState("");

  // 1. Fetch Habit details
  const {
    data: habit,
    isLoading: isHabitLoading,
    error: habitError,
    refetch: refetchHabit
  } = useQuery({
    queryKey: ["habit", habitId],
    queryFn: () => habitApi.get(habitId as string),
    enabled: Boolean(habitId)
  });

  // 2. Fetch Habit Stats
  const { data: stats } = useQuery({
    queryKey: ["habitStats", habitId],
    queryFn: () => habitApi.getStats(habitId as string),
    enabled: Boolean(habitId)
  });

  // 3. Fetch Log History
  const {
    data: logs = [],
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    error: logsError,
    refetch: refetchLogs
  } = useQuery<HabitLog[]>({
    queryKey: ["habitLogs", habitId],
    queryFn: () => habitLogApi.list(habitId as string, 30),
    enabled: Boolean(habitId)
  });

  // Find today's log
  const todayLog = logs.find((l) => l.date === today);

  useEffect(() => {
    setValueInput(todayLog?.value == null ? "" : String(todayLog.value));
    setComment(todayLog?.comment ?? "");
  }, [todayLog?.id, todayLog?.value, todayLog?.comment]);

  // Mutations
  const saveLogMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      status?: ActionStatus | null;
      value?: number | null;
      comment?: string;
    }) => {
      if (!habitId) return;
      if (todayLog) {
        return habitLogApi.update(habitId, todayLog.id, payload);
      }
      return habitLogApi.create(habitId, payload);
    },
    onError: (error) => Alert.alert("Request failed", error.message),
    onSuccess: async () => {
      await hapticSuccess();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["habitLogs", habitId] }),
        queryClient.invalidateQueries({ queryKey: ["habitStats", habitId] }),
        queryClient.invalidateQueries({ queryKey: ["habits"] }),
        queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] })
      ]);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (archived: boolean) =>
      habitApi.archive(habitId as string, archived),
    onError: (error, archived) =>
      Alert.alert(
        archived ? "Couldn't archive habit" : "Couldn't restore habit",
        error.message || "Check your connection and try again."
      ),
    onSuccess: async () => {
      await hapticLight();
      await queryClient.invalidateQueries({ queryKey: ["habits"] });
      await queryClient.invalidateQueries({ queryKey: ["habit", habitId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => habitApi.delete(habitId as string),
    onError: (error) =>
      Alert.alert(
        "Couldn't delete habit",
        error.message || "Check your connection and try again."
      ),
    onSuccess: async () => {
      await hapticSuccess();
      await queryClient.invalidateQueries({ queryKey: ["habits"] });
      router.back();
    }
  });

  const isChangingHabit = archiveMutation.isPending || deleteMutation.isPending;
  const isBusy = isChangingHabit || saveLogMutation.isPending;

  const handleDelete = () => {
    if (isBusy) return;
    Alert.alert(
      "Delete Quest",
      "Are you sure you want to permanently delete this habit and all its logged history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate()
        }
      ]
    );
  };

  const handleToggleTodayAction = (status: ActionStatus) => {
    saveLogMutation.mutate({
      date: today,
      status,
      value: null,
      comment
    });
  };

  if (habitError || profileError || (!isHabitLoading && !habit))
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ color: COLORS.danger, padding: 24 }}>
          {habitError?.message ?? profileError?.message ?? "Habit not found"}
        </Text>
        <Button
          title="Retry"
          onPress={() => {
            void refetchHabit();
            void refetchProfile();
          }}
        />
        <Button title="Go back" onPress={() => router.back()} />
      </SafeAreaView>
    );

  if (isHabitLoading || isProfileLoading || !habit || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentStreak = stats?.type === "action" ? stats.currentStreak : 0;
  const goalLabel = habit.goalDirection === "record" || habit.target == null
    ? `Record ${habit.unit || "units"}`
    : habit.goalDirection === "range"
      ? `${habit.target}–${habit.targetMax ?? habit.target} ${habit.unit || "units"}`
      : `${habit.goalDirection === "down" ? "At most" : "At least"} ${habit.target} ${habit.unit || "units"}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {habit.title}
        </Text>

        <View style={styles.headerActions}>
          {habit.type !== "expense" && (
            <TouchableOpacity
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Edit habit"
              disabled={isBusy}
              accessibilityState={{ disabled: isBusy }}
              onPress={() =>
                router.push({
                  pathname: "/habits/new",
                  params: { editId: habit.id }
                })
              }
            >
              <Pencil size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel={
              habit.archived ? "Restore habit" : "Archive habit"
            }
            onPress={() => archiveMutation.mutate(!habit.archived)}
            disabled={isBusy}
            accessibilityState={{ disabled: isBusy, busy: archiveMutation.isPending }}
          >
            {archiveMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : <Archive
              size={20}
              color={habit.archived ? COLORS.primary : COLORS.textMuted}
            />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Delete habit"
            onPress={handleDelete}
            disabled={isBusy}
            accessibilityState={{ disabled: isBusy, busy: deleteMutation.isPending }}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : <Trash2 size={20} color={COLORS.danger} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Habit Overview Card */}
        <Card style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View
              style={[
                styles.colorPill,
                { backgroundColor: habitColor(habit.color) }
              ]}
            />
            <View style={styles.overviewInfo}>
              <Text style={styles.habitMainTitle}>{habit.title}</Text>
              {habit.description ? (
                <Text style={styles.habitDescription}>{habit.description}</Text>
              ) : null}
            </View>
          </View>

          {/* Metadata Badges */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Calendar size={13} color={COLORS.textMuted} />
              <Text style={styles.metaBadgeText}>
                {habit.schedule || "Daily"}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Target size={13} color={COLORS.textMuted} />
              <Text style={styles.metaBadgeText}>
                {habit.type === "action"
                  ? "Action Quest"
                  : goalLabel}
              </Text>
            </View>
            <StreakBadge count={currentStreak} size="sm" showLabel />
          </View>
        </Card>

        {/* Today's Log Card */}
        <Card style={styles.todayCard}>
          <Text style={styles.cardHeaderTitle}>Today's Quest Status</Text>
          <Text style={styles.cardHeaderDate}>{formatDateLabel(today)}</Text>

          {isLogsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : logsError ? (
            <View style={{ gap: SPACING.sm }}>
              <Text style={styles.habitDescription}>
                Couldn't load your entries. Retry before updating today's habit.
              </Text>
              <Button title="Retry entries" loading={isLogsFetching} onPress={() => { void refetchLogs(); }} />
            </View>
          ) : <>
          {habit.requireCompletionComment && (
            <Input
              label="Completion comment"
              value={comment}
              onChangeText={setComment}
            />
          )}
          <View style={styles.todayControls}>
            {habit.type === "action" ? (
              <View style={styles.todayActionButtons}>
                <Button
                  title={
                    todayLog?.status === "done" ? "Completed ✓" : "Mark as Done"
                  }
                  variant={todayLog?.status === "done" ? "success" : "primary"}
                  onPress={() =>
                    handleToggleTodayAction(
                      todayLog?.status === "done" ? "not_done" : "done"
                    )
                  }
                  loading={saveLogMutation.isPending}
                  disabled={isChangingHabit}
                  style={{ flex: 1 }}
                />
                <Button
                  title={todayLog?.status === "skipped" ? "Skipped" : "Skip"}
                  variant={
                    todayLog?.status === "skipped" ? "secondary" : "outline"
                  }
                  onPress={() =>
                    handleToggleTodayAction(
                      todayLog?.status === "skipped" ? "not_done" : "skipped"
                    )
                  }
                  disabled={isBusy}
                  style={{ minWidth: 90 }}
                />
              </View>
            ) : (
              <View style={styles.todayMeasurableRow}>
                <Text style={styles.measurableLabel}>
                  {todayLog?.value == null
                    ? "Not logged today"
                    : `Logged today: ${todayLog.value} ${habit.unit || "units"}`}
                </Text>
                <Input
                  accessibilityLabel="Habit value"
                  value={valueInput}
                  onChangeText={setValueInput}
                  keyboardType="decimal-pad"
                  containerStyle={{ marginBottom: 0 }}
                  editable={!isBusy}
                />
                <Button
                  title="Save"
                  loading={saveLogMutation.isPending}
                  disabled={isChangingHabit}
                  onPress={() => {
                    const value = Number(valueInput);
                    if (!valueInput.trim() || !Number.isFinite(value)) {
                      Alert.alert("Invalid value", "Enter a finite number");
                      return;
                    }
                    saveLogMutation.mutate({
                      date: today,
                      status: null,
                      value,
                      comment
                    });
                  }}
                />
              </View>
            )}
          </View>
          </>}
        </Card>

        {/* Quest Log History Section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Quest History</Text>
          {!isLogsLoading && !logsError && <Text style={styles.historyCount}>{logs.length} logged entries</Text>}
        </View>

        {isLogsLoading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={{ marginTop: SPACING.md }}
          />
        ) : logsError ? (
          <Text style={styles.habitDescription}>History is temporarily unavailable.</Text>
        ) : logs.length === 0 ? (
          <Card style={styles.emptyLogsCard}>
            <Clock size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyLogsTitle}>No History Recorded Yet</Text>
            <Text style={styles.emptyLogsSubtitle}>
              Complete this quest today to establish your track record!
            </Text>
          </Card>
        ) : (
          <View style={styles.logList}>
            {logs.map((log) => {
              const isDone = completed(habit, log);
              const isSkipped = log.status === "skipped";

              return (
                <View key={log.id} style={styles.logRow}>
                  <View style={styles.logStatusIcon}>
                    {isDone ? (
                      <CheckCircle2 size={18} color={COLORS.success} />
                    ) : isSkipped ? (
                      <SkipForward size={18} color={COLORS.textMuted} />
                    ) : (
                      <XCircle size={18} color={COLORS.danger} />
                    )}
                  </View>

                  <View style={styles.logDetails}>
                    <Text style={styles.logDate}>
                      {formatDateLabel(log.date)}
                    </Text>
                    {log.value !== null && (
                      <Text style={styles.logValue}>
                        {log.value} {habit.unit || ""}
                      </Text>
                    )}
                    {log.comment ? (
                      <Text style={styles.logComment}>"{log.comment}"</Text>
                    ) : null}
                  </View>

                  <View style={styles.logStatusBadge}>
                    <Text
                      style={[
                        styles.logStatusText,
                        isDone && styles.logStatusTextDone,
                        isSkipped && styles.logStatusTextSkipped
                      ]}
                    >
                      {isDone ? "Done" : isSkipped ? "Skipped" : "Missed"}
                    </Text>
                  </View>
                </View>
              );
            })}
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
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    ...TYPOGRAPHY.title2,
    flex: 1,
    textAlign: "center",
    marginHorizontal: SPACING.sm
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl
  },
  overviewCard: {
    marginBottom: SPACING.md
  },
  overviewTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md
  },
  colorPill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    marginRight: SPACING.sm
  },
  overviewInfo: {
    flex: 1
  },
  habitMainTitle: {
    ...TYPOGRAPHY.title1
  },
  habitDescription: {
    ...TYPOGRAPHY.bodySecondary,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flexWrap: "wrap"
  },
  metaBadge: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4
  },
  metaBadgeText: {
    flexShrink: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  todayCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface
  },
  cardHeaderTitle: {
    ...TYPOGRAPHY.title3
  },
  cardHeaderDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.md
  },
  todayControls: {
    marginTop: SPACING.xs
  },
  todayActionButtons: {
    flexDirection: "row",
    gap: SPACING.sm
  },
  todayMeasurableRow: {
    gap: SPACING.sm
  },
  measurableLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary
  },
  sectionTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md
  },
  sectionTitle: {
    ...TYPOGRAPHY.title2
  },
  historyCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  emptyLogsCard: {
    alignItems: "center",
    paddingVertical: SPACING.xxl
  },
  emptyLogsTitle: {
    ...TYPOGRAPHY.title3,
    marginTop: SPACING.sm
  },
  emptyLogsSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4
  },
  logList: {
    gap: SPACING.sm
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  logStatusIcon: {
    marginRight: SPACING.md
  },
  logDetails: {
    flex: 1
  },
  logDate: {
    ...TYPOGRAPHY.body,
    fontWeight: "600"
  },
  logValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  logComment: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginTop: 2
  },
  logStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.xs
  },
  logStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted
  },
  logStatusTextDone: {
    color: COLORS.success
  },
  logStatusTextSkipped: {
    color: COLORS.textMuted
  }
});
