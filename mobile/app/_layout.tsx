import React, { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
export { ErrorBoundary } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  QueryClient,
  QueryClientProvider,
  focusManager
} from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/authStore";
import { useCelebrationStore } from "../src/stores/achievementStore";
import { useOnboardingStore } from "../src/stores/onboardingStore";
import { CelebrationHost } from "../src/components/CelebrationHost";
import { ShareCardHost } from "../src/components/ShareCard";
import { COLORS } from "../src/constants/theme";
import {
  clearHabitReminders,
  subscribeToReminderTaps
} from "../src/services/notifications";
import { localDateString } from "../src/utils/date";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30 // 30 seconds
    }
  }
});

// React Native has no window focus: treat "app became active" as focus so
// stale queries refetch on resume.
let lastActiveDate = localDateString();
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener("change", (state) => {
      const active = state === "active";
      if (active) {
        const today = localDateString();
        if (today !== lastActiveDate) {
          // A new day: every cached "today" is wrong, refresh everything.
          lastActiveDate = today;
          void queryClient.invalidateQueries();
        }
      }
      handleFocus(active);
    });
    return () => subscription.remove();
  });
}

function AuthInitialization() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        // Cold-start hydration (isLoading, token null -> saved token) must not
        // wipe the cache or cancel reminders: an offline launch would
        // otherwise leave every reminder cancelled.
        if (previous.isLoading || state.token === previous.token) return;
        // Signing out (including an expired session) drops the previous
        // user's cached data so the next account never sees it; clearAuth
        // already clears reminders.
        if (state.token === null) {
          queryClient.clear();
          useCelebrationStore.getState().reset();
          useOnboardingStore.getState().reset();
          return;
        }
        // Switching accounts without signing out.
        if (previous.token !== null && state.user?.id !== previous.user?.id) {
          queryClient.clear();
          useCelebrationStore.getState().reset();
          useOnboardingStore.getState().reset();
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

/** Opens the habit when a reminder notification is tapped. */
function ReminderTapHandler() {
  const router = useRouter();
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !userId) return;
    // Only reminders scheduled for the signed-in user open a habit.
    return subscribeToReminderTaps(userId, (habitId) => {
      // Defer one tick so a cold start finishes mounting the tab navigator.
      // withAnchor keeps the Habits list under the detail screen.
      setTimeout(
        () =>
          router.push(
            { pathname: "/habits/[id]", params: { id: habitId } },
            { withAnchor: true }
          ),
        0
      );
    });
  }, [isLoading, isAuthenticated, userId, router]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <AuthInitialization />
        <ReminderTapHandler />
        {/* Offscreen share-card renderer: before the navigator so screens paint over it. */}
        <ShareCardHost />
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

        {/* Global XP toast + achievement / level-up / streak celebrations */}
        <CelebrationHost />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
