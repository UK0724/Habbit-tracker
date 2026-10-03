import React, { useEffect, useMemo, useRef } from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { CalendarCheck2, ListTodo, Trophy, User, Wallet } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dayState, shift, weekStart } from "@habit-tracker/shared";
import type { HabitListItem } from "@habit-tracker/shared";
import { COLORS } from "../../src/constants/theme";
import { syncHabitReminders } from "../../src/services/notifications";
import { useAuthStore } from "../../src/stores/authStore";
import { useHabitsList } from "../../src/hooks/useHabitsList";
import { useDailyCheckin } from "../../src/hooks/useDailyCheckin";
import { useTimezoneSync } from "../../src/hooks/useTimezoneSync";
import { useLocalDate } from "../../src/utils/date";
import { weeklyProgress } from "../../src/utils/format";
import { WalkthroughHost } from "../../src/components/Walkthrough";

/**
 * What reminder scheduling depends on, per habit. Habit ids that need no
 * reminder today, and weekly habits resting until the end of the week
 * because the week's quota is met (the same rule as Today's rest state).
 */
const reminderPlan = (habits: HabitListItem[], today: string) => {
  const handledToday = new Set<string>();
  const suppressedUntil = new Map<string, string>();
  const parts: string[] = [];
  for (const habit of habits) {
    const recentDays = habit.recentDays ?? [];
    if (dayState(habit, recentDays, today, today) !== "pending") handledToday.add(habit.id);
    const weekly = weeklyProgress(habit, recentDays, today);
    if (weekly && weekly.done >= weekly.target) suppressedUntil.set(habit.id, shift(weekStart(today), 6));
    parts.push(
      [
        habit.id,
        habit.updatedAt,
        habit.title,
        habit.type,
        habit.reminderTime ?? "",
        habit.schedule ?? "",
        (habit.weekdays ?? []).join("."),
        habit.timesPerWeek ?? "",
        habit.archived ? 1 : 0,
        handledToday.has(habit.id) ? 1 : 0,
        suppressedUntil.get(habit.id) ?? ""
      ].join("|")
    );
  }
  return { handledToday, suppressedUntil, signature: parts.join("\n") };
};

/**
 * Tab bar metrics (see tabContentHeight). The icon box and item padding are
 * react-navigation's own (uikit variant: 28dp tall icon box, 5dp padding).
 */
const TAB_ICON_SIZE = 28;
const TAB_ITEM_PADDING = 5;
const TAB_LABEL_GAP = 3;
const TAB_LABEL_FONT_SIZE = 11;
const TAB_LABEL_LINE_HEIGHT = 15;
const TAB_LABEL_MAX_SCALE = 1.3;
const TAB_BAR_PADDING_TOP = 6;

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const tabBottomPadding = Math.max(insets.bottom, 8);
  // The bar's height is derived from what it holds (react-navigation needs a
  // number): item padding + icon + label line at the capped font scale, so
  // labels are never clipped at font scale 1.0–1.3.
  const labelScale = Math.min(Math.max(fontScale || 1, 1), TAB_LABEL_MAX_SCALE);
  const tabContentHeight =
    TAB_ITEM_PADDING * 2 + TAB_ICON_SIZE + TAB_LABEL_GAP + Math.ceil(TAB_LABEL_LINE_HEIGHT * labelScale);
  const { isLoading, isAuthenticated } = useAuthStore();
  const userId = useAuthStore((state) => state.user?.id);
  const today = useLocalDate();
  // Same cache entry as Today and Habits, so logging refreshes reminders.
  const habitsList = useHabitsList(today, !!userId);
  // Yesterday's placeholder list would mark every habit pending for today.
  const reminderHabits = habitsList.isPlaceholderData ? undefined : habitsList.data;
  useDailyCheckin();
  useTimezoneSync();

  // Optimistic updates hand out new list references on every tap; native
  // rescheduling only runs when something reminders depend on changed.
  const plan = useMemo(
    () => (reminderHabits ? reminderPlan(reminderHabits, today) : null),
    [reminderHabits, today]
  );
  const latest = useRef({ habits: reminderHabits, plan });
  latest.current = { habits: reminderHabits, plan };
  const signature = plan?.signature;

  useEffect(() => {
    const { habits, plan: current } = latest.current;
    if (!userId || !habits || !current) return;
    void syncHabitReminders(userId, habits, {
      handledToday: current.handledToday,
      suppressedUntil: current.suppressedUntil
    }).catch((error) => console.error("[reminders] Could not sync habit reminders", error));
  }, [userId, signature, today]);

  if (isLoading)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: COLORS.background
        }}
      >
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.divider,
          borderTopWidth: 1,
          height: TAB_BAR_PADDING_TOP + tabContentHeight + tabBottomPadding,
          paddingTop: TAB_BAR_PADDING_TOP,
          paddingBottom: tabBottomPadding
        },
        tabBarActiveTintColor: COLORS.primaryText,
        tabBarInactiveTintColor: COLORS.textMuted,
        // Labels scale with the system font up to 1.3×; the bar height above
        // is sized for that, so they are never clipped.
        tabBarLabel: ({ color, children }) => (
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={TAB_LABEL_MAX_SCALE}
            style={{
              color,
              fontSize: TAB_LABEL_FONT_SIZE,
              lineHeight: TAB_LABEL_LINE_HEIGHT,
              fontWeight: "600",
              marginTop: TAB_LABEL_GAP,
              includeFontPadding: false,
              textAlign: "center"
            }}
          >
            {children}
          </Text>
        )
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck2 size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ color, size }) => (
            <ListTodo size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarAccessibilityLabel: "Expenses",
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: "Trophies",
          tabBarAccessibilityLabel: "Trophy Room",
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />
        }}
      />
    </Tabs>
    {/* First-run / replayable "How Pulse works" walkthrough (a Modal over the tabs). */}
    <WalkthroughHost />
    </>
  );
}
