import React from "react";
import { Redirect, Stack } from "expo-router";
import { COLORS } from "../../src/constants/theme";

import { useAuthStore } from "../../src/stores/authStore";
import { ActivityIndicator, View } from "react-native";

export default function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuthStore();
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
  if (isAuthenticated) return <Redirect href="/(app)" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: "slide_from_right"
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
