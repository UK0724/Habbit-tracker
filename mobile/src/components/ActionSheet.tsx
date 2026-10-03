import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, LIST, SPACING } from "../constants/theme";

export interface ActionSheetOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Minimal bottom action sheet (long-press menu). Android Back and a tap on
 * the scrim close it; each option closes the sheet before running.
 */
export function ActionSheet({
  visible,
  title,
  options,
  onClose
}: {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}
          accessibilityViewIsModal
        >
          <View style={styles.handle} accessible={false} />
          {title ? (
            <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {options.map((option) => (
            <Pressable
              key={option.key}
              disabled={option.disabled}
              onPress={() => {
                onClose();
                option.onPress();
              }}
              android_ripple={{ color: COLORS.pressed }}
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(option.disabled) }}
              style={({ pressed }) => [
                styles.option,
                option.disabled && styles.optionDisabled,
                pressed && Platform.OS !== "android" ? styles.pressed : undefined
              ]}
            >
              {option.icon ? <View style={styles.optionIcon}>{option.icon}</View> : null}
              <Text style={styles.optionText} maxFontSizeMultiplier={1.5}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(5, 8, 15, 0.6)"
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.sm
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.sm
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    paddingHorizontal: LIST.gutter + SPACING.sm,
    paddingVertical: SPACING.sm
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: LIST.gutter + SPACING.sm,
    gap: SPACING.lg
  },
  optionDisabled: {
    opacity: 0.45
  },
  optionIcon: {
    width: 22,
    alignItems: "center"
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text
  },
  pressed: {
    backgroundColor: COLORS.pressed
  }
});
