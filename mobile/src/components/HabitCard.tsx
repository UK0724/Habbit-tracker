import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput
} from "react-native";
import {
  Check,
  CheckCircle2,
  Minus,
  Plus,
  SkipForward,
  RotateCcw,
  Sparkles
} from "lucide-react-native";
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { StreakBadge } from "./StreakBadge";
import { hapticSuccess, hapticLight } from "../utils/haptics";
import { habitColor } from "../utils/habitColor";
import { completed, rulesAt } from "@habit-tracker/shared";
import type { Habit, HabitLog, ActionStatus } from "@habit-tracker/shared";

export interface HabitCardProps {
  habit: Habit;
  todayLog?: HabitLog | null;
  date: string;
  streak?: number;
  onCompleteAction: (status: ActionStatus) => void;
  onSaveMeasurable: (value: number) => void;
  onUndoSkip: () => void;
  onPressCard?: () => void;
  isLoading?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  todayLog,
  date,
  streak = 0,
  onCompleteAction,
  onSaveMeasurable,
  onUndoSkip,
  onPressCard,
  isLoading = false
}) => {
  const isDone = todayLog?.status === "done";
  const isSkipped = todayLog?.status === "skipped";
  const currentMeasurableValue = todayLog?.value ?? null;

  // For measurable habits, check if target is met
  const isMeasurableMet =
    habit.type !== "action" && completed(habit, todayLog ?? undefined);

  const isFinished = isDone || isMeasurableMet;
  const goalRules = rulesAt(habit, date);
  const targetLabel =
    goalRules.target == null || habit.type !== "measurable"
      ? null
      : goalRules.goalDirection === "range" && goalRules.targetMax != null
        ? `${goalRules.target}–${goalRules.targetMax} ${habit.unit || ""}`.trim()
        : goalRules.goalDirection === "down"
          ? `At most ${goalRules.target} ${habit.unit || ""}`.trim()
          : `At least ${goalRules.target} ${habit.unit || ""}`.trim();

  // Local state for measurable input
  const [inputValue, setInputValue] = useState<string>(
    currentMeasurableValue !== null ? String(currentMeasurableValue) : "0"
  );

  useEffect(
    () =>
      setInputValue(
        currentMeasurableValue === null ? "" : String(currentMeasurableValue)
      ),
    [currentMeasurableValue, todayLog?.date]
  );

  const xpReward = habit.type === "measurable" ? 15 : 10;

  const handleToggleAction = () => {
    if (isLoading) return;
    if (isDone) {
      hapticLight();
      onCompleteAction("not_done");
    } else {
      hapticSuccess();
      onCompleteAction("done");
    }
  };

  const handleSkip = () => {
    if (isLoading) return;
    hapticLight();
    onCompleteAction("skipped");
  };

  const handleUndoSkip = () => {
    if (isLoading) return;
    hapticLight();
    if (habit.type === "action") onCompleteAction("not_done");
    else onUndoSkip();
  };

  const handleMeasurableSubmit = (val?: number) => {
    const num = val !== undefined ? val : Number(inputValue);
    if (
      isLoading ||
      !Number.isFinite(num) ||
      (val === undefined && !inputValue.trim())
    )
      return;
    if (completed(habit, { date, status: null, value: num })) {
      hapticSuccess();
    } else {
      hapticLight();
    }
    onSaveMeasurable(num);
  };

  const adjustValue = (delta: number) => {
    const current = parseFloat(inputValue) || 0;
    const next = current + delta;
    setInputValue(String(next));
    handleMeasurableSubmit(next);
  };

  return (
    <TouchableOpacity
      activeOpacity={onPressCard ? 0.85 : 1}
      onPress={onPressCard}
      style={[
        styles.card,
        isFinished && styles.cardFinished,
        isSkipped && styles.cardSkipped
      ]}
    >
      {/* Top Banner: Color accent, Habit title, XP bonus */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: habitColor(habit.color) }
            ]}
          />
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                isFinished && styles.titleFinished,
                isSkipped && styles.titleSkipped
              ]}
              numberOfLines={1}
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

        {/* Quest XP Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.xpBadge}>
            <Sparkles size={11} color={COLORS.xp} />
            <Text style={styles.xpText}>+{xpReward} XP</Text>
          </View>
        </View>
      </View>

      {/* Meta row: Streak & Target info */}
      <View style={styles.metaRow}>
        <StreakBadge count={streak} size="sm" showLabel />
        {targetLabel && <Text style={styles.targetLabel}>{targetLabel}</Text>}
        {habit.schedule && (
          <Text style={styles.scheduleLabel}>
            {habit.schedule.charAt(0).toUpperCase() + habit.schedule.slice(1)}
          </Text>
        )}
      </View>

      {/* Action / Logging Controls */}
      <View style={styles.controlsRow}>
        {habit.type === "action" ? (
          <View style={styles.actionControls}>
            {isSkipped ? (
              <View style={styles.skippedBanner}>
                <Text style={styles.skippedText}>Quest Skipped</Text>
                <TouchableOpacity
                  onPress={handleUndoSkip}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={`Undo skip for ${habit.title}`}
                  style={styles.undoButton}
                >
                  <RotateCcw size={14} color={COLORS.textSecondary} />
                  <Text style={styles.undoText}>Undo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleToggleAction}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isDone
                      ? `Mark ${habit.title} incomplete`
                      : `Mark ${habit.title} complete`
                  }
                  style={[styles.checkButton, isDone && styles.checkButtonDone]}
                >
                  {isDone ? (
                    <Check size={18} color={COLORS.white} strokeWidth={3} />
                  ) : (
                    <View style={styles.emptyCheck} />
                  )}
                  <Text
                    style={[
                      styles.checkButtonText,
                      isDone && styles.checkButtonTextDone
                    ]}
                  >
                    {isDone ? "Completed!" : "Complete Quest"}
                  </Text>
                </TouchableOpacity>

                {!isDone && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleSkip}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Skip ${habit.title} today`}
                    style={styles.skipButton}
                  >
                    <SkipForward size={14} color={COLORS.textMuted} />
                    <Text style={styles.skipText}>Skip</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          /* Measurable Habit Controls */
          <View style={styles.measurableControls}>
            {isSkipped ? (
              <View style={styles.skippedBanner}>
                <Text style={styles.skippedText}>Quest Skipped</Text>
                <TouchableOpacity
                  onPress={handleUndoSkip}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={`Undo skip for ${habit.title}`}
                  style={styles.undoButton}
                >
                  <RotateCcw size={14} color={COLORS.textSecondary} />
                  <Text style={styles.undoText}>Undo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.counterRow}>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    onPress={() => adjustValue(-1)}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${habit.title} value`}
                    style={styles.stepButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Minus size={16} color={COLORS.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.measurableInput}
                    accessibilityLabel={`${habit.title} value`}
                    keyboardType="numeric"
                    editable={!isLoading}
                    value={inputValue}
                    onChangeText={setInputValue}
                    onSubmitEditing={() => handleMeasurableSubmit()}
                    returnKeyType="done"
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    onPress={() => adjustValue(1)}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${habit.title} value`}
                    style={styles.stepButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Plus size={16} color={COLORS.text} />
                  </TouchableOpacity>
                  {habit.unit ? (
                    <Text style={styles.unitText}>{habit.unit}</Text>
                  ) : null}
                </View>

                <View style={styles.measurableActionButtons}>
                  <TouchableOpacity
                    onPress={() => handleMeasurableSubmit()}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Save ${habit.title} value`}
                    style={[
                      styles.logButton,
                      isMeasurableMet && styles.logButtonDone
                    ]}
                  >
                    {isMeasurableMet ? (
                      <CheckCircle2 size={16} color={COLORS.white} />
                    ) : (
                      <Text style={styles.logButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleSkip}
                    disabled={isLoading}
                    accessibilityRole="button"
                    accessibilityLabel={`Skip ${habit.title} today`}
                    style={styles.skipButtonCompact}
                  >
                    <SkipForward size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  cardFinished: {
    borderColor: "rgba(16, 185, 129, 0.4)",
    backgroundColor: "rgba(19, 34, 46, 0.9)"
  },
  cardSkipped: {
    opacity: 0.65,
    borderColor: COLORS.border
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.sm
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
    color: COLORS.textMuted,
    marginTop: 2
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.xpLight,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    gap: 3
  },
  xpText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.xp
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
    flexWrap: "wrap"
  },
  targetLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  scheduleLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  controlsRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceElevated,
    paddingTop: SPACING.sm
  },
  actionControls: {
    width: "100%"
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm
  },
  checkButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
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
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text
  },
  checkButtonTextDone: {
    color: COLORS.white
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "transparent",
    gap: 4
  },
  skipButtonCompact: {
    padding: 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceElevated
  },
  skipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  skippedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md
  },
  skippedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: "italic"
  },
  undoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  undoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  measurableControls: {
    width: "100%"
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  stepButton: {
    padding: 6
  },
  measurableInput: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 40,
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  unitText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginRight: 6
  },
  measurableActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  logButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60
  },
  logButtonDone: {
    backgroundColor: COLORS.success
  },
  logButtonText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.white
  }
});
