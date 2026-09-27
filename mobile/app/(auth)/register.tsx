import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Mail, Lock, AlertCircle } from "lucide-react-native";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS
} from "../../src/constants/theme";
import { authApi } from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";
import { hapticError, hapticSuccess } from "../../src/utils/haptics";

const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      await hapticSuccess();
      await setAuth(res.token, res.user);
      router.replace("/(app)");
    } catch (error: any) {
      await hapticError();
      setErrorMessage(
        error?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Sparkles size={40} color={COLORS.xp} />
          </View>
          <Text style={styles.appTitle}>Create Hero</Text>
          <Text style={styles.appSubtitle}>
            Begin your journey to mastery and unlock powerful achievements
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>Adventurer Registration</Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={COLORS.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="EMAIL"
                placeholder="hero@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
                leftIcon={<Mail size={18} color={COLORS.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="PASSWORD"
                placeholder="At least 8 characters"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={COLORS.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="CONFIRM PASSWORD"
                placeholder="Repeat password"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock size={18} color={COLORS.textMuted} />}
              />
            )}
          />

          <Button
            title={isLoading ? "Forging Hero..." : "Begin Quest"}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />

          {/* Login Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.xl
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.xpLight,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md
  },
  appTitle: {
    ...TYPOGRAPHY.hero,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.xs
  },
  appSubtitle: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.lg
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardHeading: {
    ...TYPOGRAPHY.title2,
    marginBottom: SPACING.lg,
    color: COLORS.text
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 8
  },
  errorBannerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    flex: 1
  },
  submitButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6
  },
  footerText: {
    ...TYPOGRAPHY.bodySecondary,
    color: COLORS.textMuted
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: "700"
  }
});
