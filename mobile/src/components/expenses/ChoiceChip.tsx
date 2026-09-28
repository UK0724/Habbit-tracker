import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { BORDER_RADIUS, COLORS, SPACING, TOUCH_TARGET } from "../../constants/theme";
import { hapticLight } from "../../utils/haptics";

/** Single-choice chip (radio semantics) used by the expense forms. */
export function ChoiceChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  disabled = false,
  role = "radio"
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** "button" for one-shot actions such as quick amounts. */
  role?: "radio" | "button";
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => {
        void hapticLight();
        onPress();
      }}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === "radio" ? { selected, checked: selected, disabled } : { disabled }}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
    >
      <Text
        maxFontSizeMultiplier={1.5}
        style={[styles.label, selected && styles.labelSelected]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  selected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight
  },
  disabled: { opacity: 0.5 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  labelSelected: { color: COLORS.text }
});
