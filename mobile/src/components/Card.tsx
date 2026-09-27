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
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  accentColor,
  onPress,
  padding = "lg"
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

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, containerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden"
  }
});
