import React, { useEffect } from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, ListTodo, Trophy, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../src/constants/theme";
import { habitApi } from "../../src/services/api";
import { syncHabitReminders } from "../../src/services/notifications";
import { useAuthStore } from "../../src/stores/authStore";

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const tabBottomPadding = Math.max(insets.bottom, 12);
  const { isLoading, isAuthenticated } = useAuthStore();
  const userId = useAuthStore((state) => state.user?.id);
  const { data: reminderHabits } = useQuery({
    queryKey: ["habits", "reminders", userId],
    queryFn: () => habitApi.list({ includeArchived: true }),
    enabled: !!userId
  });

  useEffect(() => {
    if (!userId || !reminderHabits) return;
    void syncHabitReminders(userId, reminderHabits).catch((error) =>
      console.error("[reminders] Could not sync habit reminders", error)
    );
  }, [userId, reminderHabits]);

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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 48 + (Platform.OS === "android" ? 12 : 8) + tabBottomPadding,
          paddingBottom: tabBottomPadding,
          paddingTop: Platform.OS === "android" ? 12 : 8
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
        }
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
        name="achievements"
        options={{
          title: "Badges",
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
  );
}
