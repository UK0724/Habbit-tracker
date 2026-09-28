import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { CloudOff } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { Button } from "./Button";
import { errorMessage } from "../services/api";

export function ErrorState({
  title = "Couldn't load this",
  error,
  onRetry,
  retrying = false,
  compact = false,
  style
}: {
  title?: string;
  error?: unknown;
  onRetry: () => void;
  retrying?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[styles.error, compact && styles.errorCompact, style]}
      accessibilityRole="alert"
    >
      {!compact && <CloudOff size={36} color={COLORS.textMuted} />}
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorBody}>{errorMessage(error, "Please try again.")}</Text>
      <Button
        title="Retry"
        size={compact ? "sm" : "md"}
        variant="secondary"
        loading={retrying}
        onPress={onRetry}
        style={styles.retry}
      />
    </View>
  );
}

/** Pulsing placeholder block (static when reduce motion is on). */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = BORDER_RADIUS.sm,
  style
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled || reduce) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true })
          ])
        );
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);
  return (
    <Animated.View
      accessible={false}
      style={[
        { width, height, borderRadius: radius, backgroundColor: COLORS.surfaceElevated, opacity },
        style
      ]}
    />
  );
}

export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <View style={styles.cardSkeleton} accessibilityLabel="Loading" accessible>
      <Skeleton width="55%" height={18} />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={index % 2 ? "70%" : "90%"} height={12} style={{ marginTop: SPACING.sm }} />
      ))}
      <Skeleton height={44} style={{ marginTop: SPACING.md }} radius={BORDER_RADIUS.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm
  },
  errorCompact: {
    paddingVertical: SPACING.md
  },
  errorTitle: {
    ...TYPOGRAPHY.title3,
    textAlign: "center"
  },
  errorBody: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center"
  },
  retry: {
    marginTop: SPACING.sm,
    minWidth: 140
  },
  cardSkeleton: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  }
});
