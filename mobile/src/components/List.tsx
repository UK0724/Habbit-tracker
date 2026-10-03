import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type AccessibilityState,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { COLORS, LIST, SPACING } from "../constants/theme";
import { Skeleton } from "./StateViews";

/**
 * Plain list building blocks (Google Tasks / Material list style): rows sit
 * directly on the background, separated by hairlines. Rows that navigate show
 * a chevron; trailing controls (checkboxes, buttons) are separate touch
 * targets so TalkBack can focus them on their own.
 */

/** Where row text starts: gutter + dot + gap. Dividers inset to this. */
export const LIST_TEXT_INSET = LIST.gutter + 12 + SPACING.lg;

export function Divider({ inset = LIST_TEXT_INSET, style }: { inset?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, { marginLeft: inset }, style]} accessible={false} />;
}

/** Small muted section label ("Not due today"): information, not a control. */
export function SectionLabel({
  children,
  trailing,
  style
}: {
  children: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sectionLabelRow, style]}>
      <Text style={styles.sectionLabel} accessibilityRole="header" maxFontSizeMultiplier={1.5}>
        {children}
      </Text>
      {trailing}
    </View>
  );
}

/** Leading colour dot (habit colour). */
export function LeadingDot({ color, dimmed = false }: { color: string; dimmed?: boolean }) {
  return (
    <View
      accessible={false}
      style={[styles.dot, { backgroundColor: color }, dimmed && styles.dotDimmed]}
    />
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  /** Separate control on the right (checkbox, button). Not part of the row press. */
  trailing?: React.ReactNode;
  /** Shows a chevron: the row navigates. */
  chevron?: boolean;
  /** Done: strikethrough + muted title. */
  struck?: boolean;
  /** Muted title without strikethrough (skipped / archived / resting). */
  muted?: boolean;
  titleLines?: number;
  titleAccessory?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
  accessibilityActions?: ReadonlyArray<AccessibilityActionInfo>;
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron = false,
  struck = false,
  muted = false,
  titleLines = 2,
  titleAccessory,
  onPress,
  onLongPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  accessibilityActions,
  onAccessibilityAction,
  style,
  titleStyle
}: ListRowProps) {
  const interactive = Boolean(onPress || onLongPress) && !disabled;
  const body = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.texts}>
        <View style={styles.titleLine}>
          <Text
            style={[styles.title, (struck || muted) && styles.titleMuted, struck && styles.titleStruck, titleStyle]}
            numberOfLines={titleLines}
            maxFontSizeMultiplier={1.5}
          >
            {title}
          </Text>
          {titleAccessory}
        </View>
        {typeof subtitle === "string" ? (
          <Text style={styles.subtitle} numberOfLines={2} maxFontSizeMultiplier={1.5}>
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </View>
      {chevron ? <ChevronRight size={20} color={COLORS.textMuted} style={styles.chevron} /> : null}
    </>
  );

  return (
    <View style={[styles.row, style]}>
      {interactive ? (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={400}
          android_ripple={{ color: COLORS.pressed }}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          accessibilityHint={accessibilityHint}
          accessibilityState={accessibilityState}
          accessibilityActions={accessibilityActions}
          onAccessibilityAction={onAccessibilityAction}
          style={({ pressed }) => [
            styles.main,
            trailing ? styles.mainWithTrailing : undefined,
            pressed && Platform.OS !== "android" ? styles.pressed : undefined
          ]}
        >
          {body}
        </Pressable>
      ) : (
        <View
          style={[styles.main, trailing ? styles.mainWithTrailing : undefined]}
          accessible
          accessibilityLabel={accessibilityLabel ?? title}
          accessibilityState={accessibilityState}
        >
          {body}
        </View>
      )}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

/** Loading placeholder shaped like a two-line list row. */
export function RowSkeleton({ trailing = true }: { trailing?: boolean }) {
  return (
    <View style={styles.skeletonRow} accessible accessibilityLabel="Loading">
      <Skeleton width={12} height={12} radius={6} />
      <View style={styles.skeletonTexts}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="38%" height={12} style={{ marginTop: SPACING.sm }} />
      </View>
      {trailing ? <Skeleton width={LIST.checkboxSize} height={LIST.checkboxSize} radius={LIST.checkboxSize / 2} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.divider
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LIST.gutter,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xs,
    gap: SPACING.sm
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  dotDimmed: {
    opacity: 0.45
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: LIST.rowMinHeight
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: LIST.gutter,
    paddingRight: LIST.gutter,
    paddingVertical: SPACING.md,
    minHeight: LIST.rowMinHeight
  },
  mainWithTrailing: {
    paddingRight: SPACING.xs
  },
  pressed: {
    backgroundColor: COLORS.pressed
  },
  leading: {
    width: 12,
    marginRight: SPACING.lg,
    alignItems: "center"
  },
  texts: {
    flex: 1,
    minWidth: 0
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    flexShrink: 1
  },
  titleMuted: {
    color: COLORS.textMuted
  },
  titleStruck: {
    textDecorationLine: "line-through"
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: COLORS.textSecondary,
    marginTop: 2
  },
  chevron: {
    marginLeft: SPACING.sm
  },
  trailing: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: LIST.gutter - (LIST.controlHitSize - LIST.checkboxSize) / 2
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: LIST.rowMinHeight,
    paddingHorizontal: LIST.gutter,
    gap: SPACING.lg
  },
  skeletonTexts: {
    flex: 1
  }
});

