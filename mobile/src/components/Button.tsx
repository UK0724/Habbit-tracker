import React from "react";
import {
  TouchableOpacity,
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
}

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
  textStyle
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    hapticLight();
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.base };

    switch (size) {
      case "sm":
        base.paddingVertical = 6;
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
        base.borderWidth = 1;
        base.borderColor = COLORS.border;
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

    if (fullWidth) {
      base.alignSelf = "stretch";
    }

    if (disabled) {
      base.opacity = 0.5;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let fontStyle: TextStyle = { ...styles.textBase };

    switch (size) {
      case "sm":
        fontStyle.fontSize = 12;
        break;
      case "lg":
        fontStyle.fontSize = 16;
        break;
      case "md":
      default:
        fontStyle.fontSize = 14;
        break;
    }

    switch (variant) {
      case "outline":
      case "ghost":
        fontStyle.color = COLORS.primary;
        break;
      case "secondary":
        fontStyle.color = COLORS.text;
        break;
      default:
        fontStyle.color = COLORS.white;
        break;
    }

    return fontStyle;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? COLORS.primary
              : COLORS.white
          }
        />
      ) : (
        <>
          {icon && iconPosition === "left" && <>{icon}</>}
          <Text
            style={[
              getTextStyle(),
              textStyle,
              icon ? { marginHorizontal: 6 } : undefined
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2
  },
  textBase: {
    fontWeight: "600",
    textAlign: "center"
  }
});
