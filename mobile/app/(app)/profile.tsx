import { ProgressHeader } from "../../src/components/ProgressHeader";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  LogOut,
  Flame,
  Diamond,
  ShieldAlert,
  Trophy,
  Zap,
  CheckCircle2,
  Server
} from "lucide-react-native";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS
} from "../../src/constants/theme";
import { LevelBadge } from "../../src/components/LevelBadge";
import { XPBar } from "../../src/components/XPBar";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import {
  gamificationApi,
  habitApi,
  type GamificationProfile
} from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";
import {
  getApiBaseUrl,
  normalizeApiUrl,
  setApiBaseUrl
} from "../../src/constants/config";
import {
  hapticSuccess,
  hapticLight,
  hapticError
} from "../../src/utils/haptics";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, clearAuth } = useAuthStore();

  const [apiUrl, setApiUrl] = useState("");
  const [isEditingApi, setIsEditingApi] = useState(false);

  useEffect(() => {
    getApiBaseUrl()
      .then(setApiUrl)
      .catch(() => setApiUrl(""));
  }, []);

  // 1. Fetch Gamification Profile
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile
  } = useQuery<GamificationProfile>({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile
  });

  // 2. Fetch Habits for count
  const { data: habits = [] } = useQuery({
    queryKey: ["habits"],
    queryFn: () => habitApi.list()
  });

  // Daily Checkin Mutation
  const checkinMutation = useMutation({
    mutationFn: gamificationApi.dailyCheckin,
    onSuccess: async (data) => {
      await hapticSuccess();
      Alert.alert(
        "Daily Check-In",
        data.alreadyCheckedIn
          ? `Already checked in today! Streak: ${data.streak} days.`
          : `Checked in successfully! +${data.xpAwarded} XP. Current streak: ${data.streak} days!`
      );
      await queryClient.invalidateQueries({
        queryKey: ["gamificationProfile"]
      });
    },
    onError: () => {
      hapticError();
    }
  });

  // Buy Freeze Mutation
  const freezeMutation = useMutation({
    mutationFn: gamificationApi.useStreakFreeze,
    onSuccess: async (data) => {
      await hapticSuccess();
      Alert.alert(
        "Streak Freeze Acquired",
        `Purchased 1 Streak Freeze! You now have ${data.streakFreezes} freezes protecting your streaks.`
      );
      await queryClient.invalidateQueries({
        queryKey: ["gamificationProfile"]
      });
    },
    onError: (err: any) => {
      hapticError();
      Alert.alert(
        "Failed",
        err?.message || "Not enough gems (requires 2 gems)."
      );
    }
  });

  const handleSaveApiUrl = async () => {
    if (apiUrl.trim()) {
      try {
        normalizeApiUrl(apiUrl.trim());
        await clearAuth();
        await setApiBaseUrl(apiUrl.trim());
      } catch (error) {
        Alert.alert(
          "Could not update server",
          error instanceof Error ? error.message : "Check the URL"
        );
        return;
      }
      setIsEditingApi(false);
      hapticLight();
      queryClient.clear();
      router.replace("/(auth)/login");
      Alert.alert("Server Updated", `Backend API set to: ${apiUrl.trim()}`);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of your quest account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAuth();
              router.replace("/(auth)/login");
            } catch (error) {
              Alert.alert(
                "Sign-out failed",
                error instanceof Error ? error.message : "Please try again."
              );
            }
          }
        }
      ]
    );
  };

  if (isProfileLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Title */}
        <Text style={styles.pageTitle}>Hero Profile</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <User size={36} color={COLORS.primary} />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || "Hero"}
              </Text>
              <View style={styles.levelRow}>
                <LevelBadge
                  level={profile?.level ?? 1}
                  title={profile?.levelTitle ?? "Novice"}
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* XP Progress Bar */}
          <XPBar
            currentXP={profile?.xpIntoLevel ?? 0}
            neededXP={profile?.xpNeeded ?? 100}
            level={profile?.level ?? 1}
            title={profile?.levelTitle}
            showDetails
          />
        </Card>

        {/* Quick Check-in Button */}
        <View style={styles.checkinBanner}>
          <View style={styles.checkinIconContainer}>
            <CheckCircle2 size={24} color={COLORS.success} />
          </View>
          <View style={styles.checkinTextContainer}>
            <Text style={styles.checkinTitle}>Daily Login Check-In</Text>
            <Text style={styles.checkinSubtitle}>
              Tap daily to maintain your login streak & earn bonus XP
            </Text>
          </View>
          <Button
            title="Check In"
            size="sm"
            variant="success"
            onPress={() => checkinMutation.mutate()}
            loading={checkinMutation.isPending}
          />
        </View>

        {/* Hero Stats 2x2 Grid */}
        <Card style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Flame size={22} color={COLORS.streak} />
            <Text style={styles.statValue}>{profile?.loginStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
            <Text style={styles.statSublabel}>
              Best: {profile?.longestStreak ?? 0} days
            </Text>
          </View>

          <View style={styles.statCard}>
            <Diamond size={22} color={COLORS.gem} />
            <Text style={styles.statValue}>{profile?.gems ?? 0}</Text>
            <Text style={styles.statLabel}>Gems Available</Text>
            <Text style={styles.statSublabel}>For streak freeze</Text>
          </View>

          <View style={styles.statCard}>
            <Zap size={22} color={COLORS.xp} />
            <Text style={styles.statValue}>
              {profile?.totalXP?.toLocaleString() ?? 0}
            </Text>
            <Text style={styles.statLabel}>Total XP Earned</Text>
            <Text style={styles.statSublabel}>Lifetime mastery</Text>
          </View>

          <View style={styles.statCard}>
            <Trophy size={22} color={COLORS.warning} />
            <Text style={styles.statValue}>
              {profile?.achievementCount ?? 0} / 30
            </Text>
            <Text style={styles.statLabel}>Badges Unlocked</Text>
            <Text style={styles.statSublabel}>In trophy room</Text>
          </View>
        </Card>

        {/* Streak Freeze Inventory Card */}
        <Card style={styles.freezeCard}>
          <View style={styles.freezeHeader}>
            <ShieldAlert size={24} color={COLORS.gem} />
            <View style={styles.freezeInfo}>
              <Text style={styles.freezeTitle}>Streak Freeze Shield</Text>
              <Text style={styles.freezeSubtitle}>
                You have {profile?.streakFreezes ?? 0} active freeze(s).
                Automatically protects your streak if you miss a day!
              </Text>
            </View>
          </View>

          <Button
            title="Buy Streak Freeze (2 Gems)"
            variant="secondary"
            size="md"
            onPress={() => freezeMutation.mutate()}
            loading={freezeMutation.isPending}
            fullWidth
            style={styles.freezeButton}
          />
        </Card>

        {/* Backend API Configuration */}
        <Card style={styles.apiCard}>
          <View style={styles.apiHeader}>
            <Server size={18} color={COLORS.textMuted} />
            <Text style={styles.apiTitle}>Backend Server Connection</Text>
          </View>
          <Text style={styles.apiSubtitle}>
            Configured for emulator or local network testing:
          </Text>

          {isEditingApi ? (
            <View style={styles.apiEditBox}>
              <Input
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://192.168.31.217:4000/api"
                autoCapitalize="none"
              />
              <View style={styles.apiButtonsRow}>
                <Button
                  title="Save Server"
                  size="sm"
                  variant="primary"
                  onPress={handleSaveApiUrl}
                />
                <Button
                  title="Cancel"
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsEditingApi(false)}
                />
              </View>
            </View>
          ) : (
            <View style={styles.apiDisplayRow}>
              <Text style={styles.apiUrlText} numberOfLines={1}>
                {apiUrl}
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditingApi(true)}
                style={styles.apiEditToggle}
              >
                <Text style={styles.apiEditText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out of Realm"
          variant="danger"
          size="lg"
          onPress={handleLogout}
          icon={<LogOut size={18} color={COLORS.white} />}
          fullWidth
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl
  },
  pageTitle: {
    ...TYPOGRAPHY.hero,
    marginBottom: SPACING.md
  },
  profileCard: {
    marginBottom: SPACING.md
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    gap: SPACING.md
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  userInfo: {
    flex: 1
  },
  userEmail: {
    ...TYPOGRAPHY.title2,
    marginBottom: 4
  },
  levelRow: {
    marginTop: 2
  },
  checkinBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    gap: SPACING.sm
  },
  checkinIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.successLight,
    alignItems: "center",
    justifyContent: "center"
  },
  checkinTextContainer: {
    flex: 1
  },
  checkinTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text
  },
  checkinSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: SPACING.xl,
    marginBottom: SPACING.md
  },
  statCard: {
    width: "50%",
    paddingHorizontal: SPACING.sm
  },
  statValue: {
    ...TYPOGRAPHY.title1,
    marginTop: SPACING.xs
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginTop: 2
  },
  statSublabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2
  },
  freezeCard: {
    marginBottom: SPACING.md
  },
  freezeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.md
  },
  freezeInfo: {
    flex: 1
  },
  freezeTitle: {
    ...TYPOGRAPHY.title3
  },
  freezeSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  freezeButton: {
    marginTop: SPACING.xs
  },
  apiCard: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface
  },
  apiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4
  },
  apiTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.textSecondary
  },
  apiSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm
  },
  apiDisplayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md
  },
  apiUrlText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1
  },
  apiEditToggle: {
    paddingLeft: SPACING.sm
  },
  apiEditText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "700"
  },
  apiEditBox: {
    marginTop: SPACING.xs
  },
  apiButtonsRow: {
    flexDirection: "row",
    gap: SPACING.sm
  },
  logoutButton: {
    marginBottom: SPACING.xl
  }
});
