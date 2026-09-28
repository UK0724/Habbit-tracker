import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput
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
  Pencil,
  CircleDashed,
  ArrowDownCircle,
  Snowflake
} from "lucide-react-native";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../../src/constants/theme";
import { Card } from "../../../src/components/Card";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { StreakBadge } from "../../../src/components/StreakBadge";
import { CardSkeleton, ErrorState } from "../../../src/components/StateViews";
import { StreakRepairBanner } from "../../../src/components/StreakRepairBanner";
import { habitColor } from "../../../src/utils/habitColor";
import {
  errorMessage,
  habitApi,
  habitLogApi,
  type PulseHabitLog,
  type RewardSummary
} from "../../../src/services/api";
import { saveHabitLog } from "../../../src/services/habitLogs";
import { useRewardCelebration } from "../../../src/hooks/useRewardCelebration";
import { useAuthStore } from "../../../src/stores/authStore";
import { formatDateLabel, dayState, shift } from "@habit-tracker/shared";
import { hapticSuccess, hapticLight, hapticError } from "../../../src/utils/haptics";
import { localDateString, useLocalDate, weekdayShort } from "../../../src/utils/date";
import { formatGoal, formatSchedule, parseNumberInput } from "../../../src/utils/format";
import type { Habit, ActionStatus } from "@habit-tracker/shared";

type EntryState = "done" | "skipped" | "frozen" | "below" | "missed" | "pending" | "rest";

/** Server limit for a log comment (habitLog.validation.ts). */
const NOTE_MAX_LENGTH = 280;

/** Status of one logged or unlogged day, in plain words. */
const entryState = (habit: Habit, logs: PulseHabitLog[], date: string, today: string): EntryState => {
  const state = dayState(habit, logs, date, today);
  const log = logs.find((entry) => entry.date === date);
  if (state === "completed") return "done";
  // A repaired day is a skipped log excused by a streak freeze.
  if (state === "skipped") return log?.frozen ? "frozen" : "skipped";
  if (state === "rest") return "rest";
  if (habit.type !== "action" && log?.value != null) return "below";
  return date >= today ? "pending" : state === "missed" ? "missed" : "pending";
};

const STATE_LABEL: Record<EntryState, string> = {
  done: "Done",
  skipped: "Skipped",
  frozen: "Frozen ❄️",
  below: "Below target",
  missed: "Missed",
  pending: "Pending",
  rest: "Rest day"
};

const STATE_COLOR: Record<EntryState, string> = {
  done: COLORS.success,
  skipped: COLORS.textMuted,
  frozen: COLORS.frozen,
  below: COLORS.warning,
  missed: COLORS.dangerText,
  pending: COLORS.textSecondary,
  rest: COLORS.textMuted
};

const StateIcon = ({ state, size = 18 }: { state: EntryState; size?: number }) => {
  const color = STATE_COLOR[state];
  switch (state) {
    case "done":
      return <CheckCircle2 size={size} color={color} />;
    case "skipped":
      return <SkipForward size={size} color={color} />;
    case "frozen":
      return <Snowflake size={size} color={color} />;
    case "below":
      return <ArrowDownCircle size={size} color={color} />;
    case "missed":
      return <XCircle size={size} color={color} />;
    default:
      return <CircleDashed size={size} color={color} />;
  }
};

export default function HabitDetailScreen() {
  const params = useLocalSearchParams<{ id: string; focusNote?: string }>();
  const habitId = Array.isArray(params.id) ? params.id[0] : params.id;
  const focusNote = params.focusNote === "1";
  const router = useRouter();
  const queryClient = useQueryClient();
  const celebrate = useRewardCelebration();
  const today = useLocalDate();
  const [valueInput, setValueInput] = useState("");
  const [comment, setComment] = useState("");
  const [noteError, setNoteError] = useState<string | undefined>();
  const noteRef = useRef<TextInput>(null);
  const focusedNote = useRef(false);

  const habitQuery = useQuery({
    queryKey: ["habit", habitId],
    queryFn: () => habitApi.get(habitId as string),
    enabled: Boolean(habitId)
  });
  const habit = habitQuery.data;

  const { data: stats } = useQuery({
    queryKey: ["habitStats", habitId],
    queryFn: () => habitApi.getStats(habitId as string),
    enabled: Boolean(habitId)
  });

  const logsQuery = useQuery<PulseHabitLog[]>({
    queryKey: ["habitLogs", habitId],
    queryFn: () => habitLogApi.list(habitId as string, 30),
    enabled: Boolean(habitId)
  });
  const logs = logsQuery.data ?? [];
  const todayLog = logs.find((l) => l.date === today);

  useEffect(() => {
    setValueInput(todayLog?.value == null ? "" : String(todayLog.value));
    setComment(todayLog?.comment ?? "");
    setNoteError(undefined);
  }, [todayLog?.id, todayLog?.value, todayLog?.comment]);

  // Opened from Today for a note-required habit: jump straight to the note.
  useEffect(() => {
    if (!focusNote || focusedNote.current || !habit || !logsQuery.isSuccess) return;
    focusedNote.current = true;
    setNoteError("Add a note to complete");
    const timer = setTimeout(() => noteRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [focusNote, habit, logsQuery.isSuccess]);

  const invalidateHabit = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["habitLogs", habitId] }),
      queryClient.invalidateQueries({ queryKey: ["habitStats", habitId] }),
      queryClient.invalidateQueries({ queryKey: ["habits"] })
    ]);

  const saveLogMutation = useMutation({
    mutationFn: async (payload: { status?: ActionStatus | null; value?: number | null; comment?: string }) => {
      const date = localDateString();
      const logId = date === today ? todayLog?.id : undefined;
      return saveHabitLog(queryClient, habitId as string, logId, { date, ...payload });
    },
    onMutate: () => ({ userId: useAuthStore.getState().user?.id }),
    onError: (error) => {
      void hapticError();
      Alert.alert("Couldn't save today's entry", errorMessage(error));
    },
    onSuccess: async (log, _payload, context) => {
      if (context?.userId !== useAuthStore.getState().user?.id) return;
      await hapticSuccess();
      celebrate(log.reward);
      await invalidateHabit();
    }
  });

  const undoMutation = useMutation({
    mutationFn: async (logId: string) => habitLogApi.delete(habitId as string, logId),
    onError: (error) => {
      void hapticError();
      Alert.alert("Couldn't undo", errorMessage(error));
    },
    onSuccess: async ({ reward }: { reward: RewardSummary | null }) => {
      await hapticLight();
      celebrate(reward);
      await invalidateHabit();
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (archived: boolean) => habitApi.archive(habitId as string, archived),
    onError: (error, archived) =>
      Alert.alert(archived ? "Couldn't archive habit" : "Couldn't restore habit", errorMessage(error)),
    onSuccess: async (_habit, archived) => {
      await hapticLight();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["habits"] }),
        queryClient.invalidateQueries({ queryKey: ["habit", habitId] })
      ]);
      Alert.alert(
        archived ? "Habit archived" : "Habit restored",
        archived
          ? "It's hidden from Today and its reminders are off. Find it under Habits › Archived."
          : "It's back on Today."
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => habitApi.delete(habitId as string),
    onError: (error) => Alert.alert("Couldn't delete habit", errorMessage(error)),
    onSuccess: async () => {
      await hapticSuccess();
      router.back();
      // Drop this habit's cached data so nothing refetches a deleted habit.
      for (const key of [["habit", habitId], ["habitLogs", habitId], ["habitStats", habitId]]) {
        await queryClient.cancelQueries({ queryKey: key });
        queryClient.removeQueries({ queryKey: key });
      }
      await queryClient.invalidateQueries({ queryKey: ["habits"] });
    }
  });

  const isChangingHabit = archiveMutation.isPending || deleteMutation.isPending;
  const isLogging = saveLogMutation.isPending || undoMutation.isPending;
  const isBusy = isChangingHabit || isLogging;

  const handleDelete = () => {
    if (isBusy) return;
    Alert.alert(
      "Delete this habit?",
      "This permanently deletes the habit and all of its history. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  const needsNote = Boolean(habit?.requireCompletionComment);
  const requireNote = () => {
    if (!needsNote || comment.trim()) return true;
    setNoteError("Add a note to complete");
    noteRef.current?.focus();
    void hapticError();
    return false;
  };

  // With an existing log, "" clears its note (the server unsets empty
  // comments); without one, an empty note is simply left out.
  const noteForSave = () => (todayLog ? comment.trim() : comment.trim() || undefined);
  const noteCounter = `${comment.length}/${NOTE_MAX_LENGTH}`;

  const markDone = () => {
    if (!requireNote()) return;
    saveLogMutation.mutate({ status: "done", value: null, comment: noteForSave() });
  };

  const saveValue = () => {
    const value = parseNumberInput(valueInput);
    if (value === null || value < 0) {
      Alert.alert("Check the amount", "Enter a number of 0 or more.");
      return;
    }
    if (!requireNote()) return;
    saveLogMutation.mutate({ status: null, value, comment: noteForSave() });
  };

  if (habitQuery.isError || (habitQuery.isSuccess && !habit))
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Couldn't open this habit"
          error={habitQuery.error ?? new Error("This habit may have been deleted.")}
          retrying={habitQuery.isFetching}
          onRetry={() => void habitQuery.refetch()}
        />
      </SafeAreaView>
    );

  if (!habit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
        </View>
      </SafeAreaView>
    );
  }

  const weekly = habit.schedule === "weekly";
  const currentStreak = stats?.type === "action" ? stats.currentStreak : 0;
  const todayState = entryState(habit, logs, today, today);
  const strip = Array.from({ length: 7 }, (_, index) => {
    const date = shift(today, index - 6);
    return { date, state: entryState(habit, logs, date, today) };
  });
  const noteChanged = Boolean(todayLog) && comment.trim() !== (todayLog?.comment ?? "").trim();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
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
              onPress={() => router.push({ pathname: "/habits/new", params: { editId: habit.id } })}
            >
              <Pencil size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel={habit.archived ? "Restore habit" : "Archive habit"}
            onPress={() => archiveMutation.mutate(!habit.archived)}
            disabled={isBusy}
            accessibilityState={{ disabled: isBusy, busy: archiveMutation.isPending }}
          >
            {archiveMutation.isPending ? (
              <ActivityIndicator size="small" color={COLORS.primaryText} />
            ) : (
              <Archive size={20} color={habit.archived ? COLORS.primaryText : COLORS.textSecondary} />
            )}
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
            ) : (
              <Trash2 size={20} color={COLORS.dangerText} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View style={[styles.colorPill, { backgroundColor: habitColor(habit.color) }]} />
            <View style={styles.overviewInfo}>
              <Text style={styles.habitMainTitle}>{habit.title}</Text>
              {habit.description ? <Text style={styles.habitDescription}>{habit.description}</Text> : null}
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Calendar size={13} color={COLORS.textMuted} />
              <Text style={styles.metaBadgeText}>{formatSchedule(habit)}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Target size={13} color={COLORS.textMuted} />
              <Text style={styles.metaBadgeText}>{formatGoal(habit, today)}</Text>
            </View>
            {habit.type === "action" && (
              <StreakBadge count={currentStreak} size="sm" showLabel unit={weekly ? "week" : "day"} />
            )}
          </View>

          {/* Last 7 days */}
          <View style={styles.strip} accessibilityLabel="Last 7 days">
            {strip.map(({ date, state }) => (
              <View
                key={date}
                style={styles.stripDay}
                accessible
                accessibilityLabel={`${formatDateLabel(date)}: ${STATE_LABEL[state].replace("❄️", "").trim()}`}
              >
                <Text style={[styles.stripLabel, date === today && styles.stripToday]}>
                  {date === today ? "Today" : weekdayShort(date)}
                </Text>
                <StateIcon state={state} size={20} />
              </View>
            ))}
          </View>

          {habit.streakRepair && !habit.archived ? (
            <View style={styles.repairSlot}>
              <StreakRepairBanner
                habitId={habit.id}
                habitTitle={habit.title}
                offer={habit.streakRepair}
                disabled={isBusy}
              />
            </View>
          ) : null}
        </Card>

        {/* Today */}
        <Card style={styles.todayCard}>
          <Text style={styles.cardHeaderTitle}>Today</Text>
          <Text style={styles.cardHeaderDate}>{formatDateLabel(today)}</Text>

          {habit.archived ? (
            <View style={{ gap: SPACING.sm }}>
              <Text style={styles.habitDescription}>
                This habit is archived. Restore it to log progress again.
              </Text>
              <Button
                title="Restore habit"
                variant="secondary"
                loading={archiveMutation.isPending}
                onPress={() => archiveMutation.mutate(false)}
              />
            </View>
          ) : habit.type === "expense" ? (
            <Text style={styles.habitDescription}>Expenses are logged on the web at habbit.abuk.in.</Text>
          ) : logsQuery.isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : logsQuery.isError ? (
            <ErrorState
              compact
              title="Couldn't load your entries"
              error={logsQuery.error}
              retrying={logsQuery.isFetching}
              onRetry={() => void logsQuery.refetch()}
            />
          ) : (
            <>
              {needsNote && (
                <Input
                  ref={noteRef}
                  label="Note (required to complete)"
                  placeholder="What did you do?"
                  value={comment}
                  onChangeText={(text) => {
                    setComment(text);
                    if (text.trim()) setNoteError(undefined);
                  }}
                  error={noteError}
                  helperText={`This habit needs a short note each time you complete it. ${noteCounter}`}
                  multiline
                  maxLength={NOTE_MAX_LENGTH}
                />
              )}
              {!needsNote && todayLog && (
                <Input
                  label="Note (optional)"
                  placeholder="Add a note to today's entry"
                  value={comment}
                  onChangeText={setComment}
                  helperText={noteCounter}
                  multiline
                  maxLength={NOTE_MAX_LENGTH}
                />
              )}
              {noteChanged && todayLog && (
                <Button
                  title="Save note"
                  variant="secondary"
                  size="sm"
                  loading={saveLogMutation.isPending}
                  disabled={isBusy}
                  onPress={() => {
                    if (needsNote && !comment.trim() && todayState === "done") {
                      setNoteError("A completed entry needs a note");
                      return;
                    }
                    saveLogMutation.mutate({ comment: comment.trim() });
                  }}
                  style={styles.noteButton}
                />
              )}

              {habit.type === "action" ? (
                <View style={styles.todayActionButtons}>
                  {todayLog?.status === "done" ? (
                    <Button
                      title="Done ✓ · Undo"
                      accessibilityLabel="Done today. Undo"
                      variant="success"
                      onPress={() => undoMutation.mutate(todayLog.id)}
                      loading={undoMutation.isPending}
                      disabled={isChangingHabit || saveLogMutation.isPending}
                      style={{ flex: 1 }}
                    />
                  ) : todayLog?.status === "skipped" ? (
                    <Button
                      title="Skipped · Undo"
                      accessibilityLabel="Skipped today. Undo skip"
                      variant="secondary"
                      onPress={() => undoMutation.mutate(todayLog.id)}
                      loading={undoMutation.isPending}
                      disabled={isChangingHabit || saveLogMutation.isPending}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <>
                      <Button
                        title="Mark as done"
                        onPress={markDone}
                        loading={saveLogMutation.isPending}
                        disabled={isChangingHabit || undoMutation.isPending}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Skip"
                        variant="outline"
                        onPress={() => saveLogMutation.mutate({ status: "skipped", value: null })}
                        disabled={isBusy}
                        style={{ minWidth: 90 }}
                      />
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.todayMeasurableRow}>
                  <Text style={styles.measurableLabel}>
                    {todayLog?.status === "skipped"
                      ? "Skipped today"
                      : todayLog?.value == null
                        ? "Nothing logged yet today"
                        : `Logged today: ${todayLog.value}${habit.unit ? ` ${habit.unit}` : ""} · ${STATE_LABEL[todayState]}`}
                  </Text>
                  <Input
                    label={habit.unit ? `Amount (${habit.unit})` : "Amount"}
                    value={valueInput}
                    onChangeText={setValueInput}
                    keyboardType="decimal-pad"
                    containerStyle={{ marginBottom: 0 }}
                    editable={!isBusy}
                    returnKeyType="done"
                    onSubmitEditing={saveValue}
                  />
                  <Button title="Save" loading={saveLogMutation.isPending} disabled={isBusy} onPress={saveValue} />
                  {todayLog && (
                    <Button
                      title={todayLog.status === "skipped" ? "Undo skip" : "Clear today's entry"}
                      variant="ghost"
                      loading={undoMutation.isPending}
                      disabled={isBusy}
                      onPress={() => undoMutation.mutate(todayLog.id)}
                    />
                  )}
                  {!todayLog && (
                    <Button
                      title="Skip today"
                      variant="ghost"
                      disabled={isBusy}
                      onPress={() => saveLogMutation.mutate({ status: "skipped", value: null })}
                    />
                  )}
                </View>
              )}
            </>
          )}
        </Card>

        {/* History */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Quest history
          </Text>
          {logsQuery.isSuccess && (
            <Text style={styles.historyCount}>
              {logs.length} {logs.length === 1 ? "entry" : "entries"}
            </Text>
          )}
        </View>

        {logsQuery.isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: SPACING.md }} />
        ) : logsQuery.isError ? (
          <Text style={styles.habitDescription}>History is unavailable right now.</Text>
        ) : logs.length === 0 ? (
          <Card style={styles.emptyLogsCard}>
            <Clock size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyLogsTitle}>No history yet</Text>
            <Text style={styles.emptyLogsSubtitle}>Complete this quest today to start your track record.</Text>
          </Card>
        ) : (
          <View style={styles.logList}>
            {logs.map((log) => {
              const shown = entryState(habit, logs, log.date, today);
              return (
                <View
                  key={log.id}
                  style={[styles.logRow, shown === "frozen" && styles.logRowFrozen]}
                  accessible
                  accessibilityLabel={`${formatDateLabel(log.date)}: ${STATE_LABEL[shown].replace("❄️", "").trim()}${
                    log.value !== null ? `, ${log.value} ${habit.unit ?? ""}` : ""
                  }${log.comment ? `. Note: ${log.comment}` : ""}`}
                >
                  <View style={styles.logStatusIcon}>
                    <StateIcon state={shown} />
                  </View>
                  <View style={styles.logDetails}>
                    <Text style={styles.logDate}>{formatDateLabel(log.date)}</Text>
                    {log.value !== null && (
                      <Text style={styles.logValue}>
                        {log.value} {habit.unit || ""}
                      </Text>
                    )}
                    {log.comment ? <Text style={styles.logComment}>"{log.comment}"</Text> : null}
                  </View>
                  <Text style={[styles.logStatusText, { color: STATE_COLOR[shown] }]}>{STATE_LABEL[shown]}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
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
    alignItems: "center"
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
    marginTop: 6,
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
    marginTop: SPACING.xs
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
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
  strip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceElevated
  },
  stripDay: {
    alignItems: "center",
    gap: 6,
    flex: 1
  },
  stripLabel: {
    ...TYPOGRAPHY.micro
  },
  stripToday: {
    color: COLORS.primaryText,
    fontWeight: "700"
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
    marginBottom: SPACING.md
  },
  noteButton: {
    alignSelf: "flex-start",
    marginBottom: SPACING.md
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
    ...TYPOGRAPHY.caption
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
  logRowFrozen: {
    borderColor: COLORS.frozenBorder,
    backgroundColor: COLORS.frozenLight
  },
  repairSlot: {
    marginTop: SPACING.md
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
    fontStyle: "italic",
    marginTop: 2
  },
  logStatusText: {
    ...TYPOGRAPHY.micro,
    fontWeight: "700",
    marginLeft: SPACING.sm
  }
});
