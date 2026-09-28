import React, { forwardRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    secureTextEntry,
    containerStyle,
    style,
    onFocus,
    onBlur,
    editable,
    accessibilityLabel,
    accessibilityHint,
    ...props
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const disabled = editable === false;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} importantForAccessibility="no" accessible={false}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          disabled && styles.inputDisabled
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isSecure}
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error ? `Error: ${error}` : accessibilityHint ?? helperText}
          accessibilityState={{ disabled }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsSecure(!isSecure)}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? "Show password" : "Hide password"}
          >
            {isSecure ? (
              <EyeOff size={18} color={COLORS.textMuted} />
            ) : (
              <Eye size={18} color={COLORS.primaryText} />
            )}
          </TouchableOpacity>
        ) : (
          rightIcon && <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md
  },
  label: {
    ...TYPOGRAPHY.label,
    marginBottom: SPACING.xs
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated
  },
  inputError: {
    borderColor: COLORS.danger
  },
  inputDisabled: {
    opacity: 0.6
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: SPACING.sm
  },
  iconLeft: {
    marginRight: SPACING.sm
  },
  iconRight: {
    marginLeft: SPACING.sm
  },
  eyeButton: {
    width: 44,
    height: 44,
    marginRight: -SPACING.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dangerText,
    marginTop: SPACING.xs
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs
  }
});
