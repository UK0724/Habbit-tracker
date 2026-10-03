import React from "react";
import {
  Pressable,
  Platform,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp
} from "react-native";
import { COLORS, BORDER_RADIUS, SPACING } from "../constants/theme";
import { hapticLight } from "../utils/haptics";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "outline"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const LABEL_COLOR: Record<ButtonVariant, string> = {
  primary: COLORS.white,
  secondary: COLORS.text,
  success: COLORS.onSuccess,
  danger: COLORS.white,
  outline: COLORS.primaryText,
  ghost: COLORS.primaryText
};

/** Ripple tint per variant: light on filled buttons, primary on text buttons. */
const RIPPLE_COLOR: Record<ButtonVariant, string> = {
  primary: "rgba(255, 255, 255, 0.24)",
  secondary: COLORS.pressed,
  success: "rgba(4, 41, 28, 0.2)",
  danger: "rgba(255, 255, 255, 0.24)",
  outline: COLORS.primaryLight,
  ghost: COLORS.primaryLight
};

/**
 * Flat, filled buttons (Material 3 style): filled = primary action,
 * secondary = tonal fill without a border, ghost = text button.
 * Only `outline` keeps a border, as an explicit opt-in.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    hapticLight();
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = { ...styles.base };

    switch (size) {
      case "sm":
        base.paddingVertical = 8;
        base.paddingHorizontal = SPACING.md;
        base.borderRadius = BORDER_RADIUS.sm;
        break;
      case "lg":
        base.paddingVertical = 16;
        base.paddingHorizontal = SPACING.xxl;
        base.borderRadius = BORDER_RADIUS.lg;
        break;
      case "md":
      default:
        base.paddingVertical = 12;
        base.paddingHorizontal = SPACING.lg;
        base.borderRadius = BORDER_RADIUS.md;
        break;
    }

    switch (variant) {
      case "secondary":
        base.backgroundColor = COLORS.surfaceElevated;
        break;
      case "success":
        base.backgroundColor = COLORS.success;
        break;
      case "danger":
        base.backgroundColor = COLORS.danger;
        break;
      case "outline":
        base.backgroundColor = "transparent";
        base.borderWidth = 1;
        base.borderColor = COLORS.primary;
        break;
      case "ghost":
        base.backgroundColor = "transparent";
        break;
      case "primary":
      default:
        base.backgroundColor = COLORS.primary;
        break;
    }

    if (fullWidth) base.alignSelf = "stretch";
    if (disabled) base.opacity = 0.5;
    return base;
  };

  const fontSize = size === "sm" ? 13 : size === "lg" ? 16 : 14;
  const color = LABEL_COLOR[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      android_ripple={inactive ? undefined : { color: RIPPLE_COLOR[variant], foreground: true }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        getContainerStyle(),
        // Android shows the ripple; other platforms dim on press.
        pressed && Platform.OS !== "android" ? styles.pressed : undefined,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon && iconPosition === "left" && <>{icon}</>}
          <Text
            maxFontSizeMultiplier={1.6}
            style={[
              styles.textBase,
              { fontSize, color },
              textStyle,
              icon ? { marginHorizontal: 6 } : undefined
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && <>{icon}</>}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // Clips the Android ripple to the rounded shape.
    overflow: "hidden"
  },
  pressed: {
    opacity: 0.75
  },
  textBase: {
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1
  }
});
