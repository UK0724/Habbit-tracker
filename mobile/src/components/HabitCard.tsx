import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from "react-native";
import {
  Check,
  Minus,
  Plus,
  SkipForward,
  RotateCcw,
  Sparkles,
  MessageSquare
} from "lucide-react-native";
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { StreakBadge } from "./StreakBadge";
import { XPFloat } from "./XPFloat";
import { hapticSuccess, hapticLight } from "../utils/haptics";
import { habitColor } from "../utils/habitColor";
import { localDateString } from "../utils/date";
import { formatGoal, formatSchedule, parseNumberInput, weeklyProgress, xpHint } from "../utils/format";
import { completed } from "@habit-tracker/shared";
import type { PulseHabitListItem } from "../services/api";
import { StreakRepairBanner } from "./StreakRepairBanner";

export interface HabitCardProps {
  habit: PulseHabitListItem;
  date: string;
  /** Only this card shows a spinner / disables while its log is saving. */
  saving?: boolean;
  onComplete: () => void;
  onSkip: () => void;
  /** Removes today's log (undo done / unskip). */
  onUndo: () => void;
  /**
   * Saves a measurable value for `date` (the local day of the first change
   * in the burst). Returns false when the save was not started (another
   * save for this habit is in flight), so the card drops its unsaved draft.
   */
  onSaveMeasurable: (value: number, date: string) => boolean | void;
  onPressCard?: () => void;
  xpFloat?: { xp: number; trigger: number } | null;
  /** Called once the XP float animation has finished. */
  onXpFloatDone?: () => void;
}

const STEP_DEBOUNCE_MS = 600;

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  date,
  saving = false,
  onComplete,
  onSkip,
  onUndo,
  onSaveMeasurable,
  onPressCard,
  xpFloat,
  onXpFloatDone
}) => {
  const log = habit.selectedDateLog;
  const isDone = log?.status === "done";
  const isSkipped = log?.status === "skipped";
  const serverValue = log?.value ?? null;
  const isMeasurable = habit.type !== "action";
  const isMeasurableMet = isMeasurable && completed(habit, log ?? undefined);
  const isFinished = isDone || isMeasurableMet;
  const weekly = weeklyProgress(habit, habit.recentDays ?? [], date);
  const streak = habit.stats?.type === "action" ? habit.stats.currentStreak : 0;

  // Local stepper/input value; saved after a pause or on submit.
  const [draft, setDraft] = useState(serverValue === null ? "" : String(serverValue));
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingText = useRef<string | null>(null);
  // Local day of the first change in a burst: a commit that fires after
  // midnight still saves the day the user was logging.
  const burstDate = useRef<string | null>(null);
  const serverText = serverValue === null ? "" : String(serverValue);

  useEffect(() => {
    if (!dirty.current) setDraft(serverText);
  }, [serverText, log?.date]);

  const commit = (raw: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pendingText.current = null;
    const logDate = burstDate.current ?? localDateString();
    burstDate.current = null;
    const value = parseNumberInput(raw);
    dirty.current = false;
    if (value === null || value < 0) {
      setDraft(serverText);
      return;
    }
    if (value === serverValue) return;
    if (completed(habit, { date: logDate, status: null, value })) void hapticSuccess();
    else void hapticLight();
    // Not started (another save is in flight): never show an unsaved value.
    if (onSaveMeasurable(value, logDate) === false) setDraft(serverText);
  };

  // Always the latest render's commit, for timers and the unmount flush.
  const commitRef = useRef(commit);
  commitRef.current = commit;

  /** Saves a pending stepper value now (navigation, unmount). */
  const flushPending = () => {
    if (timer.current && pendingText.current !== null) commitRef.current(pendingText.current);
  };

  /** Drops a pending stepper value: Skip / Undo supersede it. */
  const cancelPending = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pendingText.current = null;
    if (dirty.current) {
      dirty.current = false;
      burstDate.current = null;
      setDraft(serverText);
    }
  };

  useEffect(
    () => () => {
      // Flush, not drop, a pending value when the card goes away.
      if (timer.current && pendingText.current !== null) commitRef.current(pendingText.current);
      else if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const markDirty = () => {
    if (!dirty.current) burstDate.current = localDateString();
    dirty.current = true;
  };

  const adjustValue = (delta: number) => {
    const current = parseNumberInput(draft) ?? 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    const text = String(next);
    markDirty();
    setDraft(text);
    if (timer.current) clearTimeout(timer.current);
    pendingText.current = text;
    timer.current = setTimeout(() => commitRef.current(text), STEP_DEBOUNCE_MS);
  };

  const skip = () => {
    cancelPending();
    void hapticLight();
    onSkip();
  };

  const undo = () => {
    cancelPending();
    void hapticLight();
    onUndo();
  };

  const pressCard = onPressCard
    ? () => {
        flushPending();
        onPressCard();
      }
    : undefined;

  const statusText = isSkipped
    ? "skipped today"
    : isFinished
      ? "done today"
      : isMeasurable && serverValue !== null
        ? `logged ${serverValue}${habit.unit ? ` ${habit.unit}` : ""}`
        : "not done yet";

  const skippedBanner = (
    <View style={styles.skippedBanner}>
      <Text style={styles.skippedText}>Skipped today</Text>
      <TouchableOpacity
        onPress={undo}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={`Undo skip for ${habit.title}`}
        style={styles.undoButton}
      >
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
        ) : (
          <>
            <RotateCcw size={14} color={COLORS.textSecondary} />
            <Text style={styles.undoText}>Undo</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, isFinished && styles.cardFinished, isSkipped && styles.cardSkipped]}>
      {/* The summary opens details; the controls below stay separately focusable. */}
      <TouchableOpacity
        activeOpacity={pressCard ? 0.85 : 1}
        onPress={pressCard}
        disabled={!pressCard}
        accessibilityRole="button"
        accessibilityLabel={`${habit.title}, ${statusText}. ${formatSchedule(habit)}.`}
        accessibilityHint="Opens habit details"
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.colorIndicator, { backgroundColor: habitColor(habit.color) }]} />
            <View style={styles.titleContainer}>
              <Text
                style={[styles.title, isFinished && styles.titleFinished, isSkipped && styles.titleSkipped]}
                numberOfLines={2}
              >
                {habit.title}
              </Text>
              {habit.description ? (
                <Text style={styles.description} numberOfLines={1}>
                  {habit.description}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.xpBadge}>
            <Sparkles size={11} color={COLORS.xpText} />
            <Text style={styles.xpText} maxFontSizeMultiplier={1.3}>
              {xpHint(habit)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {weekly ? (
            <Text style={[styles.metaText, weekly.done >= weekly.target && styles.metaDone]}>
              {weekly.done}/{weekly.target} this week
            </Text>
          ) : null}
          {!isMeasurable && (streak > 0 || !weekly) ? (
            <StreakBadge count={streak} size="sm" showLabel unit={weekly ? "week" : "day"} />
          ) : null}
          {isMeasurable && <Text style={styles.metaText}>{formatGoal(habit, date)}</Text>}
          {!weekly && <Text style={styles.scheduleLabel}>{formatSchedule(habit)}</Text>}
          {habit.requireCompletionComment && !isFinished && (
            <View style={styles.noteHint}>
              <MessageSquare size={12} color={COLORS.textMuted} />
              <Text style={styles.scheduleLabel}>Note needed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

        {habit.streakRepair && !habit.archived ? (
          <StreakRepairBanner
            habitId={habit.id}
            habitTitle={habit.title}
            offer={habit.streakRepair}
            disabled={saving}
          />
        ) : null}

        <View style={styles.controlsRow}>
          {isSkipped ? (
            skippedBanner
          ) : !isMeasurable ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  if (isDone) {
                    undo();
                  } else {
                    void hapticSuccess();
                    onComplete();
                  }
                }}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ checked: isDone, busy: saving, disabled: saving }}
                accessibilityLabel={isDone ? `Undo ${habit.title}` : `Complete ${habit.title}`}
                style={[styles.checkButton, isDone && styles.checkButtonDone]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={isDone ? COLORS.onSuccess : COLORS.text} />
                ) : isDone ? (
                  <Check size={18} color={COLORS.onSuccess} strokeWidth={3} />
                ) : (
                  <View style={styles.emptyCheck} />
                )}
                <Text style={[styles.checkButtonText, isDone && styles.checkButtonTextDone]}>
                  {isDone ? "Done · tap to undo" : "Complete"}
                </Text>
              </TouchableOpacity>

              {!isDone && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={skip}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={`Skip ${habit.title} today`}
                  style={styles.skipButton}
                >
                  <SkipForward size={14} color={COLORS.textSecondary} />
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.counterRow}>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  onPress={() => adjustValue(-1)}
                  disabled={saving || (parseNumberInput(draft) ?? 0) <= 0}
                  accessibilityRole="button"
                  accessibilityLabel={`Decrease ${habit.title}`}
                  style={styles.stepButton}
                >
                  <Minus size={18} color={COLORS.text} />
                </TouchableOpacity>
                <TextInput
                  style={styles.measurableInput}
                  accessibilityLabel={`${habit.title} amount${habit.unit ? ` in ${habit.unit}` : ""}`}
                  keyboardType="decimal-pad"
                  value={draft}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  // Read-only while a save is in flight, so typing is never dropped silently.
                  editable={!saving}
                  accessibilityState={{ disabled: saving, busy: saving }}
                  onChangeText={(text) => {
                    markDirty();
                    setDraft(text);
                  }}
                  onSubmitEditing={() => commit(draft)}
                  onEndEditing={() => dirty.current && commit(draft)}
                  returnKeyType="done"
                  selectTextOnFocus
                  maxFontSizeMultiplier={1.3}
                />
                <TouchableOpacity
                  onPress={() => adjustValue(1)}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={`Increase ${habit.title}`}
                  style={styles.stepButton}
                >
                  <Plus size={18} color={COLORS.text} />
                </TouchableOpacity>
                {habit.unit ? (
                  <Text style={styles.unitText} numberOfLines={1}>
                    {habit.unit}
                  </Text>
                ) : null}
              </View>

              <View style={styles.measurableActionButtons}>
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.primaryText} style={styles.savingIndicator} />
                ) : isMeasurableMet ? (
                  <View style={styles.metPill} accessible accessibilityLabel="Target met">
                    <Check size={16} color={COLORS.onSuccess} strokeWidth={3} />
                  </View>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={skip}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel={`Skip ${habit.title} today`}
                  style={styles.skipButtonCompact}
                >
                  <SkipForward size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
      {xpFloat ? (
        <XPFloat xp={xpFloat.xp} trigger={xpFloat.trigger} onDone={onXpFloatDone} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: SPACING.md
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md
  },
  cardFinished: {
    borderColor: COLORS.successBorder
  },
  cardSkipped: {
    opacity: 0.75
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
    gap: SPACING.sm
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm
  },
  titleContainer: {
    flex: 1
  },
  title: {
    ...TYPOGRAPHY.title3,
    color: COLORS.text
  },
  titleFinished: {
    color: COLORS.textSecondary
  },
  titleSkipped: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted
  },
  description: {
    ...TYPOGRAPHY.caption,
    marginTop: 2
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.xpLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.xpBorder,
    gap: 3
  },
  xpText: {
    ...TYPOGRAPHY.micro,
    fontWeight: "700",
    color: COLORS.xpText
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
    flexWrap: "wrap"
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  metaDone: {
    color: COLORS.success
  },
  scheduleLabel: {
    ...TYPOGRAPHY.caption
  },
  noteHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  controlsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceElevated,
    paddingTop: SPACING.sm
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm
  },
  checkButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8
  },
  checkButtonDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success
  },
  emptyCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textMuted
  },
  checkButtonText: {
    ...TYPOGRAPHY.label,
    color: COLORS.text
  },
  checkButtonTextDone: {
    color: COLORS.onSuccess
  },
  skipButton: {
    minHeight: 44,
    minWidth: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: 4
  },
  skipButtonCompact: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceElevated
  },
  skipText: {
    ...TYPOGRAPHY.label
  },
  skippedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingLeft: SPACING.md,
    borderRadius: BORDER_RADIUS.md
  },
  skippedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: "italic"
  },
  undoButton: {
    minHeight: 44,
    minWidth: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    gap: 4
  },
  undoText: {
    ...TYPOGRAPHY.label
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm
  },
  stepperContainer: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  measurableInput: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 48,
    minHeight: 44,
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  unitText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
    // Shrinks and ellipsizes on narrow (360dp) screens instead of pushing
    // the Skip button out of the card.
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 80
  },
  measurableActionButtons: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  savingIndicator: {
    width: 32
  },
  metPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center"
  }
});
