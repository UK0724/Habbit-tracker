import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, X } from "lucide-react-native";
import {
  BORDER_RADIUS,
  COLORS,
  SPACING,
  TOUCH_TARGET,
  TYPOGRAPHY
} from "../../constants/theme";

/**
 * Modal shell for Expenses: a full-screen entry form or compact budget sheet.
 * Android Modal resize reporting differs across React Native versions. Bound
 * its viewport to the keyboard's screen position as well as the window size.
 * Taking the minimum avoids subtracting the keyboard twice; iOS uses padding.
 */
export function ExpenseBottomSheet({
  visible,
  title,
  onClose,
  onShow,
  closeDisabled = false,
  presentation = "sheet",
  footer,
  children
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onShow?: () => void;
  closeDisabled?: boolean;
  /** Expense entry uses the same full-screen form layout as habit creation. */
  presentation?: "sheet" | "fullScreen";
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
  useEffect(() => {
    setKeyboardTop(null);
    if (!visible || Platform.OS !== "android") return;
    const shown = Keyboard.addListener("keyboardDidShow", (event) => {
      const top = event.endCoordinates.screenY;
      setKeyboardTop(Number.isFinite(top) && top > 0 ? top : null);
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardTop(null));
    return () => { shown.remove(); hidden.remove(); };
  }, [visible]);
  const viewportHeight = keyboardTop == null ? windowHeight : Math.min(windowHeight, keyboardTop);
  const fullScreen = presentation === "fullScreen";
  const close = () => {
    if (!closeDisabled) onClose();
  };
  return (
    <Modal
      transparent={!fullScreen}
      presentationStyle={fullScreen ? "fullScreen" : "overFullScreen"}
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
      onShow={onShow}
    >
      <KeyboardAvoidingView
        // Android can first measure a newly opened Modal at its content height
        // before reporting the dialog size. Bound that first layout to the
        // window; flexShrink still lets adjustResize make room for the keyboard.
        style={[
          styles.viewport,
          { height: viewportHeight, maxHeight: keyboardTop == null ? undefined : viewportHeight },
          fullScreen && styles.fullScreenViewport
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.backdrop,
            fullScreen && [
              styles.fullScreenBackdrop,
              {
                paddingTop: insets.top,
                paddingLeft: insets.left,
                paddingRight: insets.right
              }
            ]
          ]}
        >
          {!fullScreen && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close"
              importantForAccessibility="no"
            />
          )}
          <View
            accessibilityViewIsModal
            style={
              fullScreen
                ? styles.fullScreenForm
                : [styles.sheet, { marginTop: insets.top + SPACING.xxl }]
            }
          >
            {!fullScreen && <View style={styles.handle} />}
            {fullScreen ? (
              <View style={styles.formHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={close}
                  disabled={closeDisabled}
                  accessibilityRole="button"
                  accessibilityLabel="Close expense form"
                  accessibilityState={{ disabled: closeDisabled }}
                >
                  <ArrowLeft size={22} color={COLORS.text} />
                </TouchableOpacity>
                <Text
                  style={styles.formTitle}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.6}
                >
                  {title}
                </Text>
                <View style={styles.headerSpacer} />
              </View>
            ) : (
              <View style={styles.header}>
                <Text
                  style={styles.title}
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.6}
                >
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
            )}
            <ScrollView
              style={fullScreen ? styles.formScroll : styles.flexShrink}
              contentContainerStyle={
                fullScreen ? styles.formContent : styles.content
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {children}
            </ScrollView>
            <View
              style={[
                styles.footer,
                fullScreen && styles.formFooter,
                {
                  paddingBottom:
                    Math.max(insets.bottom, SPACING.md) +
                    (fullScreen ? 0 : SPACING.sm)
                }
              ]}
            >
              {footer}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewport: { flexShrink: 1 },
  // Grow to an opaque modal's full bounds without a zero flex basis on first open.
  fullScreenViewport: { flexGrow: 1, backgroundColor: COLORS.background },
  fullScreenBackdrop: {
    backgroundColor: COLORS.background,
    justifyContent: "flex-start"
  },
  fullScreenForm: { flex: 1, backgroundColor: COLORS.background },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  formTitle: { ...TYPOGRAPHY.title2, flex: 1, textAlign: "center" },
  headerSpacer: { width: TOUCH_TARGET },
  formScroll: { flex: 1 },
  formContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  formFooter: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background
  },
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
