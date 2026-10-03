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
import { Mail, Lock, AlertCircle } from "lucide-react-native";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../src/constants/theme";
import { PRIVACY_POLICY_URL, openLink } from "../../src/constants/links";
import { authApi, errorMessage as describeError } from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";
import { hapticError, hapticSuccess } from "../../src/utils/haptics";

const utf8Length = (value: string) => {
  let bytes = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
};

const registerSchema = z
  .object({
    email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .refine((value) => utf8Length(value) <= 72, "That password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" }
  });

  const onSubmit = async (data: RegisterFormData) => {
    if (isLoading) return;
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
    } catch (error) {
      await hapticError();
      setErrorMessage(describeError(error, "Couldn't create your account. Please try again."));
    } finally {
      setIsLoading(false);
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
            Join Pulse
          </Text>
          <Text style={styles.appSubtitle}>
            Turn your habits into daily quests and unlock badges as you go.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardHeading}>Create account</Text>

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
                placeholder="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => confirmRef.current?.focus()}
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
                ref={confirmRef}
                label="Confirm password"
                placeholder="Type it again"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={() => void submit()}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock size={18} color={COLORS.textMuted} />}
              />
            )}
          />

          <Button
            title={isLoading ? "Creating account…" : "Create account"}
            onPress={() => void submit()}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />

          <View style={styles.legalRow}>
            <Text style={styles.legalText}>Learn how Pulse handles your data in our</Text>
            <TouchableOpacity
              style={styles.inlineLink}
              accessibilityRole="link"
              accessibilityHint="Opens in your browser"
              onPress={() => void openLink(PRIVACY_POLICY_URL)}
            >
              <Text style={styles.linkTextSmall}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              style={styles.inlineLink}
              accessibilityRole="link"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(auth)/login"))}
            >
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: COLORS.xpLight,
    borderWidth: 2,
    borderColor: COLORS.xpBorder,
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
  submitButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm
  },
  legalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xs
  },
  legalText: {
    ...TYPOGRAPHY.caption,
    textAlign: "center"
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
  linkTextSmall: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryText,
    fontWeight: "700",
    textDecorationLine: "underline"
  }
});
