import React from "react";
import { Stack } from "expo-router";
import { COLORS } from "../../../src/constants/theme";

// expo-router only honours initialRouteName for a navigation that passes
// `{ withAnchor: true }`. Every push into this stack from outside it (Today,
// reminder taps) passes withAnchor, so the list sits underneath and Back
// returns to Habits instead of leaving the tab.
export const unstable_settings = { initialRouteName: "index" };

export default function HabitsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: "slide_from_right"
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
