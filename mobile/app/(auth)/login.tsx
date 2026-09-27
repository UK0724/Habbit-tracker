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
import { Flame, Mail, Lock, AlertCircle, Settings } from "lucide-react-native";
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
import { getApiBaseUrl, setApiBaseUrl } from "../../src/constants/config";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
  password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await authApi.login({
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
        error?.message || "Login failed. Please verify credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openServerConfig = async () => {
    const current = await getApiBaseUrl().catch(() => "");
    setServerUrlInput(current);
    setShowServerConfig(true);
  };

  const handleSaveServerUrl = async () => {
    if (serverUrlInput.trim()) {
      try {
        await setApiBaseUrl(serverUrlInput.trim());
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Invalid URL");
        return;
      }
      setShowServerConfig(false);
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
            <Flame size={44} color={COLORS.streak} fill={COLORS.streak} />
          </View>
          <Text style={styles.appTitle}>Habit Tracker</Text>
          <Text style={styles.appSubtitle}>
            Level up your daily habits & build unstoppable momentum
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>Sign In to Quest</Text>

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
                placeholder="warrior@example.com"
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
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={COLORS.textMuted} />}
              />
            )}
          />

          <Button
            title={isLoading ? "Entering Realm..." : "Sign In"}
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />

          {/* Register Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New adventurer?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Server Config Accordion for LAN testing */}
        <View style={styles.serverConfigContainer}>
          {!showServerConfig ? (
            <TouchableOpacity
              onPress={openServerConfig}
              style={styles.serverConfigToggle}
            >
              <Settings size={14} color={COLORS.textMuted} />
              <Text style={styles.serverConfigToggleText}>Server Settings</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.serverBox}>
              <Text style={styles.serverBoxLabel}>Backend API Base URL:</Text>
              <Input
                value={serverUrlInput}
                onChangeText={setServerUrlInput}
                placeholder="http://192.168.31.217:4000/api"
                autoCapitalize="none"
              />
              <View style={styles.serverBoxButtons}>
                <Button
                  title="Save Server"
                  size="sm"
                  variant="secondary"
                  onPress={handleSaveServerUrl}
                />
                <Button
                  title="Cancel"
                  size="sm"
                  variant="ghost"
                  onPress={() => setShowServerConfig(false)}
                />
              </View>
            </View>
          )}
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
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(249, 115, 22, 0.3)",
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
  },
  serverConfigContainer: {
    marginTop: SPACING.xxl,
    alignItems: "center"
  },
  serverConfigToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: SPACING.sm
  },
  serverConfigToggleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  serverBox: {
    width: "100%",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  serverBoxLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs
  },
  serverBoxButtons: {
    flexDirection: "row",
    gap: SPACING.sm
  }
});
