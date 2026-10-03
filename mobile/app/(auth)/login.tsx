import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type TextInput,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, AlertCircle, Settings } from "lucide-react-native";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../src/constants/theme";
import { authApi, errorMessage as describeError } from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";
import { hapticError, hapticSuccess } from "../../src/utils/haptics";
import { getApiBaseUrl, setApiBaseUrl } from "../../src/constants/config";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password")
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState("");
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
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
    } catch (error) {
      await hapticError();
      setErrorMessage(describeError(error, "Couldn't sign in. Check your email and password."));
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
        setErrorMessage(describeError(error, "Enter a valid URL"));
        return;
      }
      setShowServerConfig(false);
    }
  };

  const submit = handleSubmit(onSubmit);

  return (
    // Edge-to-edge (Android 15 / targetSdk 35): keep content clear of the
    // status and navigation bars.
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require("../../assets/splash-icon.png")}
            style={styles.logo}
            accessible={false}
          />
          <Text style={styles.appTitle} accessibilityRole="header">
            Pulse
          </Text>
          <Text style={styles.appSubtitle}>Build habits, earn XP and keep your streak alive.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>Sign in</Text>

          {errorMessage && (
            <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
              <AlertCircle size={18} color={COLORS.dangerText} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
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
                ref={passwordRef}
                label="Password"
                placeholder="Your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={COLORS.textMuted} />}
              />
            )}
          />

          <TouchableOpacity
            style={styles.forgotLink}
            accessibilityRole="link"
            onPress={() =>
              router.push({
                pathname: "/(auth)/forgot-password",
                params: getValues("email").trim() ? { email: getValues("email").trim() } : {}
              })
            }
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title={isLoading ? "Signing in…" : "Sign in"}
            onPress={() => void submit()}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to Pulse?</Text>
            <TouchableOpacity
              style={styles.inlineLink}
              accessibilityRole="link"
              onPress={() => router.replace("/(auth)/register")}
            >
              <Text style={styles.linkText}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Server settings for emulator / LAN testing; hidden in store builds */}
        {(__DEV__ || process.env.EXPO_PUBLIC_ALLOW_LAN_HTTP === "true") && (
          <View style={styles.serverConfigContainer}>
            {!showServerConfig ? (
              <TouchableOpacity
                onPress={openServerConfig}
                style={styles.serverConfigToggle}
                accessibilityRole="button"
              >
                <Settings size={14} color={COLORS.textMuted} />
                <Text style={styles.serverConfigToggleText}>Server settings (testing)</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.serverBox}>
                <Input
                  label="API base URL"
                  value={serverUrlInput}
                  onChangeText={setServerUrlInput}
                  placeholder="http://10.0.2.2:4000/api"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.serverBoxButtons}>
                  <Button title="Save server" size="sm" variant="secondary" onPress={handleSaveServerUrl} />
                  <Button title="Cancel" size="sm" variant="ghost" onPress={() => setShowServerConfig(false)} />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
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
  logo: { width: 84, height: 84, marginBottom: SPACING.md },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.streakLight,
    borderWidth: 2,
    borderColor: COLORS.streakBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md
  },
  appTitle: {
    ...TYPOGRAPHY.hero,
    textAlign: "center",
    marginBottom: SPACING.xs
  },
  appSubtitle: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
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
    marginBottom: SPACING.lg
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 8
  },
  errorBannerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.dangerText,
    flex: 1
  },
  forgotLink: {
    alignSelf: "flex-end",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: SPACING.xs,
    marginTop: -SPACING.sm
  },
  submitButton: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4
  },
  footerText: {
    ...TYPOGRAPHY.bodySecondary
  },
  inlineLink: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: SPACING.xs
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primaryText,
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
    minHeight: 44,
    paddingHorizontal: SPACING.sm
  },
  serverConfigToggleText: {
    ...TYPOGRAPHY.caption
  },
  serverBox: {
    width: "100%",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  serverBoxButtons: {
    flexDirection: "row",
    gap: SPACING.sm
  }
});
