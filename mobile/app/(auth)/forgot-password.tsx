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
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react-native";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../src/constants/theme";
import { authApi, errorMessage as describeError } from "../../src/services/api";
import { hapticError, hapticSuccess } from "../../src/utils/haptics";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address")
});

type FormData = z.infer<typeof schema>;

export const RESET_SENT_MESSAGE =
  "If an account exists for that email, we've sent a reset link. Open it on this phone to choose a new password.";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = typeof params.email === "string" ? params.email : "";
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: initialEmail }
  });

  const onSubmit = async ({ email }: FormData) => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      // The server always answers the same way, whether or not the account exists.
      await authApi.forgotPassword(email.trim());
      await hapticSuccess();
      setSent(true);
    } catch (requestError) {
      await hapticError();
      setError(describeError(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const submit = handleSubmit(onSubmit);
  const goToSignIn = () => (router.canGoBack() ? router.back() : router.replace("/(auth)/login"));

  return (
    // Edge-to-edge (Android 15 / targetSdk 35): keep content clear of the
    // status and navigation bars.
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
          onPress={goToSignIn}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            {sent ? (
              <MailCheck size={38} color={COLORS.success} />
            ) : (
              <KeyRound size={38} color={COLORS.primaryText} />
            )}
          </View>
          <Text style={styles.appTitle} accessibilityRole="header">
            {sent ? "Check your email" : "Reset your password"}
          </Text>
          {!sent && (
            <Text style={styles.appSubtitle}>
              Enter the email you use for Pulse and we'll send you a link to choose a new password.
            </Text>
          )}
        </View>

        <View style={styles.formCard}>
          {sent ? (
            <>
              <Text style={styles.sentText} accessibilityLiveRegion="polite">
                {RESET_SENT_MESSAGE}
              </Text>
              <Text style={styles.sentHint}>The link expires in 30 minutes. Check your spam folder if you don't see it.</Text>
              <Button title="Back to sign in" onPress={goToSignIn} fullWidth size="lg" />
              <Button
                title="Send another link"
                variant="ghost"
                onPress={() => setSent(false)}
                fullWidth
                style={styles.secondary}
              />
            </>
          ) : (
            <>
              {error && (
                <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
                  <AlertCircle size={18} color={COLORS.dangerText} />
                  <Text style={styles.errorBannerText}>{error}</Text>
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
                    returnKeyType="done"
                    onSubmitEditing={() => void submit()}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    leftIcon={<Mail size={18} color={COLORS.textMuted} />}
                  />
                )}
              />
              <Button
                title={isLoading ? "Sending…" : "Send reset link"}
                onPress={() => void submit()}
                loading={isLoading}
                fullWidth
                size="lg"
              />
            </>
          )}
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
  backButton: {
    // Inside the safe area, so it sits below the status bar.
    position: "absolute",
    top: SPACING.sm,
    left: SPACING.md,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md
  },
  appTitle: {
    ...TYPOGRAPHY.title1,
    textAlign: "center",
    marginBottom: SPACING.xs
  },
  appSubtitle: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    paddingHorizontal: SPACING.md
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sentText: {
    ...TYPOGRAPHY.body,
    lineHeight: 21,
    marginBottom: SPACING.sm
  },
  sentHint: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.lg
  },
  secondary: {
    marginTop: SPACING.sm
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
  }
});
