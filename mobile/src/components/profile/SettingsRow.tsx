import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { ChevronRight, ExternalLink } from "lucide-react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";

/**
 * Android Settings-style list primitives: a small section label, then plain
 * rows (no card) separated by hairlines. Only rows that do something get a
 * ripple and a trailing affordance (chevron, external-link, switch, button).
 */

export const RIPPLE = { color: "rgba(255, 255, 255, 0.08)" } as const;

export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionLabelWrap, style]}>
      <Text style={styles.sectionLabel} accessibilityRole="header" maxFontSizeMultiplier={1.6}>
        {children}
      </Text>
    </View>
  );
}

export function RowDivider({ inset = true }: { inset?: boolean }) {
  return <View style={[styles.divider, inset && styles.dividerInset]} />;
}

export type SettingsRowProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Plain trailing text (read-only value). */
  value?: string;
  /** Chevron for navigation, external for links that open the browser. */
  accessory?: "chevron" | "external" | "none";
  /** Custom trailing control (switch, button). */
  trailing?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function SettingsRow({
  title,
  subtitle,
  icon,
  value,
  accessory = "none",
  trailing,
  onPress,
  danger,
  loading,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  style
}: SettingsRowProps) {
  const body = (
    <>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.copy}>
        <Text style={[styles.title, danger && styles.danger]} maxFontSizeMultiplier={1.8}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.8}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.value} maxFontSizeMultiplier={1.6}>
          {value}
        </Text>
      ) : null}
      {loading ? <ActivityIndicator size="small" color={COLORS.textSecondary} /> : trailing}
      {!loading && accessory === "chevron" ? <ChevronRight size={20} color={COLORS.textMuted} /> : null}
      {!loading && accessory === "external" ? <ExternalLink size={18} color={COLORS.textMuted} /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[styles.row, style]}
        accessible={!trailing}
        accessibilityLabel={accessibilityLabel}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={RIPPLE}
      accessibilityRole={accessibilityRole ?? "button"}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style
      ]}
    >
      {body}
    </Pressable>
  );
}

/** Small outlined button for use as a row's trailing control. */
export function RowButton({
  title,
  onPress,
  disabled,
  loading,
  tone = "primary",
  accessibilityLabel
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "filled";
  accessibilityLabel?: string;
}) {
  const filled = tone === "filled";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: "rgba(255, 255, 255, 0.16)", borderless: false }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.rowButton,
        filled ? styles.rowButtonFilled : styles.rowButtonOutline,
        pressed && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={filled ? COLORS.white : COLORS.primaryText} />
      ) : (
        <Text
          style={[styles.rowButtonText, { color: filled ? COLORS.white : COLORS.primaryText }]}
          maxFontSizeMultiplier={1.5}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionLabelWrap: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xs,
    paddingHorizontal: SPACING.lg
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryText
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.lg
  },
  pressed: {
    opacity: 0.85
  },
  disabled: {
    opacity: 0.5
  },
  icon: {
    width: 24,
    alignItems: "center"
  },
  copy: {
    flex: 1,
    minWidth: 0
  },
  title: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: COLORS.text
  },
  subtitle: {
    ...TYPOGRAPHY.bodySecondary,
    marginTop: 2
  },
  value: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "right",
    flexShrink: 1
  },
  danger: {
    color: COLORS.dangerText
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border
  },
  dividerInset: {
    marginLeft: SPACING.lg + 24 + SPACING.lg
  },
  rowButton: {
    minHeight: 40,
    minWidth: 64,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  rowButtonOutline: {
    borderWidth: 1,
    borderColor: COLORS.borderLight
  },
  rowButtonFilled: {
    backgroundColor: COLORS.primary
  },
  rowButtonText: {
    fontSize: 14,
    fontWeight: "600"
  }
});
