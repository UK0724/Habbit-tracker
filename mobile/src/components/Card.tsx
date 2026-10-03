import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity
} from "react-native";
import { COLORS, BORDER_RADIUS, SPACING } from "../constants/theme";

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
  onPress?: () => void;
  padding?: keyof typeof SPACING;
  /**
   * "filled" (default) is a tinted surface. "plain" has no surface at all:
   * a section of information sitting directly on the background.
   */
  variant?: "filled" | "plain";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  accentColor,
  onPress,
  padding = "lg",
  variant = "filled"
}) => {
  const containerStyle: ViewStyle = {
    padding: SPACING[padding],
    ...(accentColor
      ? {
          borderColor: accentColor,
          borderLeftWidth: 4
        }
      : {})
  };
  const surface = variant === "plain" ? styles.plain : styles.card;

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[surface, containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[surface, containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden"
  },
  plain: {
    backgroundColor: COLORS.transparent
  }
});
