import React, { useEffect } from "react";
import { Stack } from "expo-router";
export { ErrorBoundary } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/authStore";
import { useAchievementStore } from "../src/stores/achievementStore";
import { AchievementBanner } from "../src/components/AchievementBanner";
import { COLORS } from "../src/constants/theme";
import { clearHabitReminders } from "../src/services/notifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30 // 30 seconds
    }
  }
});

function AuthInitialization() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (state.token !== previous.token) {
          queryClient.clear();
          useAchievementStore.getState().reset();
          void clearHabitReminders().catch((error) =>
            console.error("[reminders] Could not clear reminders", error)
          );
        }
      }),
    []
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return null;
}

export default function RootLayout() {
  const { isBannerVisible, currentAchievement, dismissBanner, mode } =
    useAchievementStore();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <AuthInitialization />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: "fade"
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>

        {/* Global Achievement Unlock Overlay */}
        <AchievementBanner
          visible={isBannerVisible}
          mode={mode}
          achievement={currentAchievement}
          onDismiss={dismissBanner}
        />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
