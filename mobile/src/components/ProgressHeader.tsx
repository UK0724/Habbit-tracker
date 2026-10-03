import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Gem, RotateCw, Zap } from "lucide-react-native";
import { gamificationApi } from "../services/api";
import { COLORS } from "../constants/theme";
import { useCountUp } from "../hooks/useCountUp";
import { Skeleton } from "./StateViews";

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
});

function Stat({
  value,
  label,
  description,
  Icon,
  color,
  loading
}: {
  value: number | undefined;
  label: string;
  description: string;
  Icon: typeof Zap;
  color: string;
  loading: boolean;
}) {
  const router = useRouter();
  const display = useCountUp(value);
  const scale = useRef(new Animated.Value(1)).current;
  const previous = useRef(value);

  useEffect(() => {
    if (
      previous.current != null &&
      value != null &&
      value !== previous.current
    ) {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.18,
          useNativeDriver: true,
          speed: 40,
          bounciness: 12
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 8
        })
      ]).start();
    }
    previous.current = value;
  }, [value, scale]);

  return (
    <Pressable
      style={styles.stat}
      accessibilityRole="button"
      accessibilityLabel={
        value == null
          ? `${label} loading`
          : `${value} ${description}. Open profile`
      }
      onPress={() => router.push("/(app)/profile")}
    >
      <Icon size={18} color={color} strokeWidth={2.5} />
      <View style={styles.copy}>
        {loading || display == null ? (
          <Skeleton width={30} height={16} />
        ) : (
          <Animated.Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            style={[styles.value, { transform: [{ scale }] }]}
          >
            {compact.format(display)}
          </Animated.Text>
        )}
      </View>
    </Pressable>
  );
}

export function ProgressHeader() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile
  });

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.brand}
        accessibilityRole="button"
        accessibilityLabel="Pulse, go to Today"
        onPress={() => router.push("/(app)")}
      >
        <Image
          source={require("../../assets/icon.png")}
          style={styles.brandIcon}
          accessible={false}
        />
      </Pressable>
      {isError && !data ? (
        <Pressable
          style={styles.errorRow}
          accessibilityRole="button"
          accessibilityLabel="Couldn't load your progress. Retry"
          onPress={() => void refetch()}
          disabled={isFetching}
        >
          <RotateCw size={16} color={COLORS.textSecondary} />
          <Text
            style={styles.errorText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {isFetching ? "Retrying…" : "Couldn't load progress · Retry"}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.stats}>
          <Stat
            value={data?.loginStreak}
            label="Streak"
            description="day check-in streak"
            Icon={Flame}
            color={COLORS.streak}
            loading={isLoading}
          />
          <Stat
            value={data?.totalXP}
            label="XP"
            description="total XP"
            Icon={Zap}
            color={COLORS.gold}
            loading={isLoading}
          />
          <Stat
            value={data?.gems}
            label="Gems"
            description="gems"
            Icon={Gem}
            color={COLORS.gem}
            loading={isLoading}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    minHeight: 60
  },
  brand: {
    width: 40,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: "auto"
  },
  brandIcon: { width: 32, height: 32, borderRadius: 9 },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 12,
    marginLeft: 12
  },
  stat: {
    flexShrink: 1,
    minWidth: 44,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 4
  },
  copy: { flexShrink: 1, minWidth: 0 },
  value: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    fontVariant: ["tabular-nums"]
  },
  errorRow: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  errorText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary }
});
