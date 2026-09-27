import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Gem, Zap } from "lucide-react-native";
import { gamificationApi } from "../services/api";
import { COLORS } from "../constants/theme";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function ProgressHeader() {
  const router = useRouter();
  const { data } = useQuery({ queryKey: ["gamificationProfile"], queryFn: gamificationApi.getProfile });
  const stats = [
    { label: "XP", value: data?.totalXP, Icon: Zap, color: "#FBBF24", description: "total XP" },
    { label: "Gems", value: data?.gems, Icon: Gem, color: "#38BDF8", description: "gems available" },
    { label: "Streak", value: data?.loginStreak, Icon: Flame, color: "#FB923C", description: "day streak" }
  ];
  return <View style={styles.row}>
    <Pressable style={styles.brand} accessibilityRole="button" accessibilityLabel="Pulse home"
      onPress={() => router.push("/(app)")}>
      <Image source={require("../../assets/icon.png")} style={styles.brandIcon} accessible={false} />
    </Pressable>
    {stats.map(({ label, value, Icon, color, description }) => (
      <Pressable key={label} style={styles.stat} accessibilityRole="button"
        accessibilityLabel={value == null ? `${label} loading` : `${value} ${description}`}
        onPress={() => router.push("/(app)/profile")}>
        <Icon size={22} color={color} strokeWidth={2.5} />
        <View style={styles.copy}>
          <Text style={[styles.value, { color }]}>{value == null ? "—" : compact.format(value)}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </Pressable>
    ))}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  brand: { width: 44, minHeight: 48, alignItems: "center", justifyContent: "center", marginRight: 4 },
  brandIcon: { width: 34, height: 34, borderRadius: 10 },
  stat: { flex: 1, minWidth: 0, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 4 },
  copy: { flexShrink: 1 },
  value: { fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] },
  label: { fontSize: 11, fontWeight: "600", color: COLORS.textSecondary }
});
