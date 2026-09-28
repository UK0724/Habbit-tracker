import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../../constants/theme";

/**
 * Bottom-sheet modal for the Expenses forms. Android's Modal window uses
 * adjustResize (its status-bar translucency keeps bottom insets), so the
 * window already shrinks for the keyboard there; iOS needs padding.
 */
export function ExpenseBottomSheet({
  visible,
  title,
  onClose,
  closeDisabled = false,
  footer,
  children
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeDisabled?: boolean;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const close = () => {
    if (!closeDisabled) onClose();
  };
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
            importantForAccessibility="no"
          />
          <View
            accessibilityViewIsModal
            style={[styles.sheet, { marginTop: insets.top + SPACING.xxl }]}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.6}>
                {title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={close}
                disabled={closeDisabled}
                accessibilityRole="button"
                accessibilityLabel="Close"
                accessibilityState={{ disabled: closeDisabled }}
              >
                <X size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.flexShrink}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {children}
            </ScrollView>
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.sm }]}>
              {footer}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexGrow: 0, flexShrink: 1 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.overlay
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 1
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginTop: SPACING.sm
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.sm,
    paddingTop: SPACING.xs
  },
  title: { ...TYPOGRAPHY.title2, flex: 1 },
  closeButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm
  }
});
