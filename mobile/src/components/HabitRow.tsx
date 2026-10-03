import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type AccessibilityActionEvent
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  Check,
  ChevronRight,
  Minus,
  PencilLine,
  Plus,
  RotateCcw,
  SkipForward,
  SlidersHorizontal
} from "lucide-react-native";
import { COLORS, LIST, SPACING } from "../constants/theme";
import { XPFloat } from "./XPFloat";
import { ListRow, LeadingDot, LIST_TEXT_INSET } from "./List";
import { ActionSheet, type ActionSheetOption } from "./ActionSheet";
import { Button } from "./Button";
import { StreakRepairBanner } from "./StreakRepairBanner";
import { hapticSuccess, hapticLight } from "../utils/haptics";
import { habitColor } from "../utils/habitColor";
import { localDateString } from "../utils/date";
import { parseNumberInput } from "../utils/format";
import { measurableFraction, todaySubtitle } from "../utils/habitRow";
import { completed } from "@habit-tracker/shared";
import type { PulseHabitListItem } from "../services/api";

export interface HabitRowProps {
  habit: PulseHabitListItem;
  date: string;
  /** Only this row shows a spinner / disables while its log is saving. */
  saving?: boolean;
  onComplete: () => void;
  onSkip: () => void;
  /** Removes today's log (undo done / unskip). */
  onUndo: () => void;
  /**
   * Saves a measurable value for `date` (the local day of the first change
   * in the burst). Returns false when the save was not started (another
   * save for this habit is in flight), so the row drops its unsaved draft.
   */
  onSaveMeasurable: (value: number, date: string) => boolean | void;
  /** Opens habit details (row tap). */
  onPressCard?: () => void;
  /** Opens the edit form (long-press menu). */
  onEdit?: () => void;
  xpFloat?: { xp: number; trigger: number } | null;
  /** Called once the XP float animation has finished. */
  onXpFloatDone?: () => void;
}

const STEP_DEBOUNCE_MS = 600;
const BOX = LIST.checkboxSize;
const RING_STROKE = 2.5;

/** Thin progress ring around the measurable "+" button. */
function ProgressRing({ fraction, color }: { fraction: number | null; color: string }) {
  const radius = (BOX - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <Svg width={BOX} height={BOX} style={StyleSheet.absoluteFill}>
      <Circle
        cx={BOX / 2}
        cy={BOX / 2}
        r={radius}
        stroke={COLORS.textMuted}
        strokeWidth={2}
        fill="none"
      />
      {fraction ? (
        <Circle
          cx={BOX / 2}
          cy={BOX / 2}
          r={radius}
          stroke={color}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${BOX / 2} ${BOX / 2})`}
        />
      ) : null}
    </Svg>
  );
}

/**
 * One Today habit as a plain list row: colour dot, title, muted subtitle,
 * and a trailing round checkbox (or "+" for measurable habits, which opens
 * an inline stepper). Long press opens Skip / Undo / Details / Edit.
 */
export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  date,
  saving = false,
  onComplete,
  onSkip,
  onUndo,
  onSaveMeasurable,
  onPressCard,
  onEdit,
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
  const color = habitColor(habit.color);

  const [editorOpen, setEditorOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Local stepper/input value; saved after a pause or on Save.
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

  /** Saves a pending stepper value now (navigation, closing the editor, unmount). */
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
      // Flush, not drop, a pending value when the row goes away.
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
    if (saving) return;
    cancelPending();
    setEditorOpen(false);
    void hapticLight();
    onSkip();
  };

  const undo = () => {
    if (saving) return;
    cancelPending();
    void hapticLight();
    onUndo();
  };

  const toggleDone = () => {
    if (saving) return;
    if (isDone) {
      undo();
    } else {
      void hapticSuccess();
      onComplete();
    }
  };

  /** Save typed text (or a pending stepper value) and close the editor. */
  const saveAndClose = () => {
    if (dirty.current) commitRef.current(pendingText.current ?? draft);
    setEditorOpen(false);
  };

  const toggleEditor = () => {
    if (editorOpen) saveAndClose();
    else {
      void hapticLight();
      setEditorOpen(true);
    }
  };

  const openDetails = onPressCard
    ? () => {
        flushPending();
        onPressCard();
      }
    : undefined;

  const openEdit = onEdit
    ? () => {
        flushPending();
        onEdit();
      }
    : undefined;

  // Live draft while the stepper is open, so the subtitle follows the taps.
  const draftValue = parseNumberInput(draft);
  const shownValue = isMeasurable && editorOpen ? draftValue : serverValue;
  const subtitleParts = todaySubtitle(
    habit,
    log ? { status: log.status, value: shownValue } : shownValue !== null ? { status: null, value: shownValue } : null,
    date
  );
  const subtitle = subtitleParts.join(" · ");
  const fraction = isMeasurable ? measurableFraction(habit, shownValue, date) : null;

  const statusText = isSkipped
    ? "skipped today"
    : isFinished
      ? "done today"
      : isMeasurable && serverValue !== null
        ? `logged ${serverValue}${habit.unit ? ` ${habit.unit}` : ""}`
        : "not done yet";

  const menuOptions: ActionSheetOption[] = [
    ...(isSkipped
      ? [{ key: "undo-skip", label: "Undo skip", icon: <RotateCcw size={20} color={COLORS.textSecondary} />, onPress: undo, disabled: saving }]
      : isDone
        ? [{ key: "undo-done", label: "Mark as not done", icon: <RotateCcw size={20} color={COLORS.textSecondary} />, onPress: undo, disabled: saving }]
        : [{ key: "skip", label: "Skip today", icon: <SkipForward size={20} color={COLORS.textSecondary} />, onPress: skip, disabled: saving }]),
    ...(isMeasurable && !isSkipped
      ? [{ key: "log", label: "Log amount", icon: <SlidersHorizontal size={20} color={COLORS.textSecondary} />, onPress: () => setEditorOpen(true), disabled: saving }]
      : []),
    ...(openDetails
      ? [{ key: "details", label: "Open details", icon: <ChevronRight size={20} color={COLORS.textSecondary} />, onPress: openDetails }]
      : []),
    ...(openEdit
      ? [{ key: "edit", label: "Edit habit", icon: <PencilLine size={20} color={COLORS.textSecondary} />, onPress: openEdit }]
      : [])
  ];

  const a11yActions = [
    { name: "activate" as const, label: "Open details" },
    { name: "longpress" as const, label: "More options" },
    isSkipped
      ? { name: "undoSkip", label: "Undo skip" }
      : isDone
        ? { name: "undo", label: "Mark as not done" }
        : { name: "skip", label: "Skip today" },
    ...(!isMeasurable && !isSkipped && !isDone ? [{ name: "complete", label: "Mark as done" }] : [])
  ];

  const onA11yAction = (event: AccessibilityActionEvent) => {
    switch (event.nativeEvent.actionName) {
      case "activate":
        openDetails?.();
        break;
      case "longpress":
        setMenuOpen(true);
        break;
      case "skip":
        skip();
        break;
      case "undo":
      case "undoSkip":
        undo();
        break;
      case "complete":
        toggleDone();
        break;
    }
  };

  let trailing: React.ReactNode;
  if (isSkipped) {
    trailing = (
      <Pressable
        onPress={undo}
        disabled={saving}
        android_ripple={{ color: COLORS.primaryLight, borderless: true, radius: 28 }}
        accessibilityRole="button"
        accessibilityLabel={`Undo skip for ${habit.title}`}
        accessibilityState={{ disabled: saving, busy: saving }}
        style={({ pressed }) => [styles.textButton, pressed && Platform.OS !== "android" && styles.dim]}
      >
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.primaryText} />
        ) : (
          <Text style={styles.textButtonLabel} maxFontSizeMultiplier={1.3}>
            Undo
          </Text>
        )}
      </Pressable>
    );
  } else if (!isMeasurable) {
    trailing = (
      <Pressable
        onPress={toggleDone}
        disabled={saving}
        hitSlop={4}
        android_ripple={{ color: isDone ? COLORS.successLight : COLORS.pressed, borderless: true, radius: 24 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone, busy: saving, disabled: saving }}
        accessibilityLabel={isDone ? `Mark ${habit.title} as not done` : `Mark ${habit.title} as done`}
        accessibilityHint={habit.requireCompletionComment && !isDone ? "Opens details to add the required note" : undefined}
        style={({ pressed }) => [styles.control, pressed && Platform.OS !== "android" && styles.dim]}
      >
        <View style={[styles.box, isDone ? styles.boxDone : styles.boxEmpty]}>
          {saving ? (
            <ActivityIndicator size="small" color={isDone ? COLORS.onSuccess : COLORS.textSecondary} />
          ) : isDone ? (
            <Check size={18} color={COLORS.onSuccess} strokeWidth={3} />
          ) : null}
        </View>
      </Pressable>
    );
  } else {
    trailing = (
      <Pressable
        onPress={toggleEditor}
        disabled={saving && !editorOpen}
        hitSlop={4}
        android_ripple={{ color: COLORS.pressed, borderless: true, radius: 24 }}
        accessibilityRole="button"
        accessibilityState={{ expanded: editorOpen, busy: saving }}
        accessibilityLabel={
          editorOpen ? `Close ${habit.title} amount` : `Log ${habit.title} amount${isMeasurableMet ? ", target met" : ""}`
        }
        style={({ pressed }) => [styles.control, pressed && Platform.OS !== "android" && styles.dim]}
      >
        {isMeasurableMet && !editorOpen ? (
          <View style={[styles.box, styles.boxDone]}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.onSuccess} />
            ) : (
              <Check size={18} color={COLORS.onSuccess} strokeWidth={3} />
            )}
          </View>
        ) : (
          <View style={styles.box}>
            <ProgressRing fraction={fraction} color={color} />
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            ) : editorOpen ? (
              <Check size={16} color={COLORS.text} strokeWidth={2.5} />
            ) : (
              <Plus size={16} color={COLORS.text} strokeWidth={2.5} />
            )}
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ListRow
        title={habit.title}
        subtitle={subtitle}
        leading={<LeadingDot color={color} dimmed={isSkipped} />}
        trailing={trailing}
        struck={isFinished}
        muted={isSkipped}
        onPress={openDetails}
        onLongPress={() => {
          void hapticLight();
          setMenuOpen(true);
        }}
        accessibilityLabel={`${habit.title}, ${statusText}. ${subtitle}.`}
        accessibilityHint="Opens habit details. Long press for more options."
        accessibilityActions={a11yActions}
        onAccessibilityAction={onA11yAction}
      />

      {isMeasurable && editorOpen && !isSkipped ? (
        <View style={styles.editor}>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => adjustValue(-1)}
              disabled={saving || (draftValue ?? 0) <= 0}
              android_ripple={{ color: COLORS.pressed, borderless: true, radius: 22 }}
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${habit.title}`}
              style={styles.stepButton}
            >
              <Minus size={18} color={COLORS.text} />
            </Pressable>
            <TextInput
              style={styles.input}
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
              onSubmitEditing={saveAndClose}
              onEndEditing={() => dirty.current && commit(draft)}
              returnKeyType="done"
              selectTextOnFocus
              maxFontSizeMultiplier={1.3}
            />
            <Pressable
              onPress={() => adjustValue(1)}
              disabled={saving}
              android_ripple={{ color: COLORS.pressed, borderless: true, radius: 22 }}
              accessibilityRole="button"
              accessibilityLabel={`Increase ${habit.title}`}
              style={styles.stepButton}
            >
              <Plus size={18} color={COLORS.text} />
            </Pressable>
            {habit.unit ? (
              <Text style={styles.unit} numberOfLines={1}>
                {habit.unit}
              </Text>
            ) : null}
          </View>
          <Button title="Save" size="sm" onPress={saveAndClose} loading={saving} style={styles.save} />
        </View>
      ) : null}

      {habit.streakRepair && !habit.archived ? (
        <StreakRepairBanner
          habitId={habit.id}
          habitTitle={habit.title}
          offer={habit.streakRepair}
          disabled={saving}
          inset={LIST_TEXT_INSET}
          style={styles.repair}
        />
      ) : null}

      {xpFloat ? <XPFloat xp={xpFloat.xp} trigger={xpFloat.trigger} onDone={onXpFloatDone} /> : null}

      <ActionSheet visible={menuOpen} title={habit.title} options={menuOptions} onClose={() => setMenuOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative"
  },
  control: {
    width: LIST.controlHitSize,
    height: LIST.controlHitSize,
    alignItems: "center",
    justifyContent: "center"
  },
  dim: {
    opacity: 0.6
  },
  box: {
    width: BOX,
    height: BOX,
    borderRadius: BOX / 2,
    alignItems: "center",
    justifyContent: "center"
  },
  boxEmpty: {
    borderWidth: 2,
    borderColor: COLORS.textMuted
  },
  boxDone: {
    backgroundColor: COLORS.success
  },
  textButton: {
    minWidth: LIST.controlHitSize,
    height: LIST.controlHitSize,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  textButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryText
  },
  editor: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingLeft: LIST_TEXT_INSET - SPACING.sm,
    paddingRight: LIST.gutter,
    paddingBottom: SPACING.md
  },
  stepper: {
    flex: 1,
    minWidth: 0,
    flexWrap: "nowrap",
    flexDirection: "row",
    alignItems: "center"
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated
  },
  input: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    width: 72,
    minHeight: 44,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  unit: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flexShrink: 1,
    minWidth: 0
  },
  save: {
    flexShrink: 0,
    minWidth: 72
  },
  repair: {
    marginTop: -SPACING.sm,
    paddingBottom: SPACING.xs
  }
});
