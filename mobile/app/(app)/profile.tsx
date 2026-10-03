import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Switch,
  Image,
  ActivityIndicator,
  type AlertButton
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  User,
  LogOut,
  CheckCircle2,
  Server,
  Share2,
  Volume2,
  FileText,
  LifeBuoy,
  Trash2,
  RotateCcw,
  Camera,
  CircleHelp
} from "lucide-react-native";
import { openWalkthrough } from "../../src/stores/onboardingStore";
import { shift } from "@habit-tracker/shared";
import { COLORS, SPACING, TYPOGRAPHY } from "../../src/constants/theme";
import { DELETE_ACCOUNT_HELP_URL, PRIVACY_POLICY_URL, openLink } from "../../src/constants/links";
import { ProgressHeader } from "../../src/components/ProgressHeader";
import { XPBar } from "../../src/components/XPBar";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { RowButton, RowDivider, SectionLabel, SettingsRow } from "../../src/components/profile/SettingsRow";
import { ErrorState, Skeleton } from "../../src/components/StateViews";
import {
  authApi,
  errorMessage,
  gamificationApi,
  type GamificationProfile
} from "../../src/services/api";
import { useAuthStore } from "../../src/stores/authStore";
import { getApiBaseUrl, normalizeApiUrl, setApiBaseUrl } from "../../src/constants/config";
import { hapticSuccess, hapticLight, hapticError } from "../../src/utils/haptics";
import { useRewardCelebration } from "../../src/hooks/useRewardCelebration";
import { FREEZE_COST, RESTORE_COST, useBuyFreeze, useRestoreStreak } from "../../src/hooks/useStreakActions";
import { useShare } from "../../src/hooks/useShare";
import { useAvatar, useRemoveAvatar, useSetAvatar } from "../../src/hooks/useAvatar";
import { useHabitsList } from "../../src/hooks/useHabitsList";
import { pickAvatarDataUrl } from "../../src/services/avatarPhoto";
import { useSoundEnabled } from "../../src/utils/sound";
import { timeLeft, useLocalDate, weekdayShort } from "../../src/utils/date";
import { plural } from "../../src/utils/format";

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 180, 365];

function AvatarRing({
  profile,
  avatar,
  busy,
  onPress
}: {
  profile: GamificationProfile;
  avatar: string | null;
  busy: boolean;
  onPress: () => void;
}) {
  const size = 76;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress =
    profile.xpNeeded == null ? 1 : profile.xpNeeded > 0 ? Math.min(1, profile.xpIntoLevel / profile.xpNeeded) : 0;
  return (
    <Pressable
      style={({ pressed }) => [{ width: size, height: size }, pressed && { opacity: 0.8 }]}
      onPress={onPress}
      disabled={busy}
      android_ripple={{ color: "rgba(255, 255, 255, 0.12)", borderless: true, radius: size / 2 }}
      accessibilityRole="button"
      accessibilityLabel="Change profile photo"
      accessibilityHint={`Level ${profile.level}`}
      accessibilityState={{ busy, disabled: busy }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={COLORS.surfaceElevated} strokeWidth={stroke} fill="none" />
        {progress > 0 && <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.xp}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />}
      </Svg>
      <View style={styles.avatarInner}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} accessible={false} />
        ) : (
          <User size={30} color={COLORS.primaryText} />
        )}
        {busy && (
          <View style={styles.avatarBusy}>
            <ActivityIndicator size="small" color={COLORS.white} />
          </View>
        )}
      </View>
      <View style={styles.avatarEdit}>
        <Camera size={12} color={COLORS.white} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const celebrate = useRewardCelebration();
  const { user, clearAuth } = useAuthStore();
  const { share, sharing } = useShare();
  const today = useLocalDate();
  const habitsQuery = useHabitsList(today);
  const avatarQuery = useAvatar();
  const setAvatarMutation = useSetAvatar();
  const removeAvatarMutation = useRemoveAvatar();
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const picking = useRef(false);
  const [soundOn, setSoundOn] = useSoundEnabled();
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [apiUrl, setApiUrl] = useState("");
  const [isEditingApi, setIsEditingApi] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  // Store builds talk only to the bundled HTTPS API; the switcher is for testing.
  const canChangeServer = __DEV__ || process.env.EXPO_PUBLIC_ALLOW_LAN_HTTP === "true";

  useEffect(() => {
    if (!canChangeServer) return;
    getApiBaseUrl()
      .then(setApiUrl)
      .catch(() => setApiUrl(""));
  }, [canChangeServer]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const profileQuery = useQuery<GamificationProfile>({
    queryKey: ["gamificationProfile"],
    queryFn: gamificationApi.getProfile
  });
  const profile = profileQuery.data;

  const checkinMutation = useMutation({
    mutationFn: gamificationApi.dailyCheckin,
    onSuccess: async (data) => {
      // No active habit yet: nothing was recorded, so nothing to celebrate.
      if (data.needsHabit) {
        void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
        void queryClient.invalidateQueries({ queryKey: ["habits"] });
        return;
      }
      await hapticSuccess();
      if (data.alreadyCheckedIn) {
        void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
        return;
      }
      celebrate(data, { checkin: data });
    },
    onError: (error) => {
      void hapticError();
      Alert.alert("Couldn't check in", errorMessage(error));
    }
  });
  const freezeMutation = useBuyFreeze();
  const restoreMutation = useRestoreStreak();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      profileQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ["achievements"] })
    ]);
    setRefreshing(false);
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) return;
    try {
      normalizeApiUrl(apiUrl.trim());
      await clearAuth();
      await setApiBaseUrl(apiUrl.trim());
    } catch (error) {
      Alert.alert("Couldn't update the server", errorMessage(error, "Check the URL"));
      return;
    }
    setIsEditingApi(false);
    hapticLight();
    queryClient.clear();
    router.replace("/(auth)/login");
  };

  const handleSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await clearAuth();
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert("Couldn't sign out", errorMessage(error));
          }
        }
      }
    ]);
  };

  const deleteMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(deletePassword),
    onSuccess: async () => {
      await hapticSuccess();
      queryClient.clear();
      // The account is already gone server-side; never report failure after this point.
      try {
        await clearAuth();
      } catch (error) {
        console.error("[profile] Could not clear the local session", error);
      }
      router.replace("/(auth)/login");
      Alert.alert("Account deleted", "Your account and all of its data were removed.");
    },
    onError: (error) => {
      void hapticError();
      Alert.alert("Couldn't delete your account", errorMessage(error));
    }
  });

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      Alert.alert("Password needed", "Enter your current password to confirm.");
      return;
    }
    Alert.alert(
      "Delete your account?",
      "This permanently removes your account, habits, history, expenses and progress. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: () => deleteMutation.mutate() }
      ]
    );
  };

  const shareProgress = () => {
    if (!profile) return;
    void share({ kind: "progress" });
  };

  const avatar = avatarQuery.data ?? null;
  const photoBusy = pickingPhoto || setAvatarMutation.isPending || removeAvatarMutation.isPending;

  const choosePhoto = async () => {
    if (picking.current) return;
    picking.current = true;
    setPickingPhoto(true);
    try {
      const dataUrl = await pickAvatarDataUrl();
      if (!dataUrl) return; // Picker cancelled.
      await setAvatarMutation.mutateAsync(dataUrl);
      void hapticSuccess();
    } catch (error) {
      void hapticError();
      Alert.alert("Couldn't update your photo", errorMessage(error));
    } finally {
      picking.current = false;
      setPickingPhoto(false);
    }
  };

  const removePhoto = () =>
    removeAvatarMutation.mutate(undefined, {
      onSuccess: () => void hapticLight(),
      onError: (error) => {
        void hapticError();
        Alert.alert("Couldn't remove your photo", errorMessage(error));
      }
    });

  const onAvatarPress = () => {
    if (photoBusy) return;
    const buttons: AlertButton[] = [
      { text: avatar ? "Choose new photo" : "Choose photo", onPress: () => void choosePhoto() }
    ];
    if (avatar) buttons.push({ text: "Remove photo", style: "destructive", onPress: removePhoto });
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert(
      "Profile photo",
      avatar ? "Pick a new photo from your library, or remove this one." : "Pick a photo from your library.",
      buttons,
      { cancelable: true }
    );
  };

  // The check-in streak starts with the first habit.
  const hasNoHabits =
    habitsQuery.isSuccess && !(habitsQuery.data ?? []).some((habit) => !habit.archived);
  const needsFirstHabit = Boolean(profile && profile.loginStreak === 0 && hasNoHabits);

  // Check-in state, derived from the streak and last check-in date.
  const checkedInToday = Boolean(profile && profile.lastLoginDate === profile.today);
  const streakStart =
    profile?.lastLoginDate && profile.loginStreak > 0
      ? shift(profile.lastLoginDate, -(profile.loginStreak - 1))
      : null;
  const week = profile
    ? Array.from({ length: 7 }, (_, index) => {
        const date = shift(profile.today, index - 6);
        const done = Boolean(streakStart && profile.lastLoginDate && date >= streakStart && date <= profile.lastLoginDate);
        return { date, done, isToday: date === profile.today };
      })
    : [];
  const nextMilestone = profile ? STREAK_MILESTONES.find((m) => m > profile.loginStreak) : undefined;
  const broken = profile?.brokenStreak ?? null;
  const restoreLeft = broken ? timeLeft(broken.restoreExpiresAt, now) : null;
  const showRestore = Boolean(broken && (restoreLeft || !broken.restoreExpiresAt));
  const gems = profile?.gems ?? 0;
  const freezes = profile?.streakFreezes ?? 0;

  const xpRemaining = profile && profile.xpNeeded != null ? Math.max(0, profile.xpNeeded - profile.xpIntoLevel) : 0;
  const levelLine = profile ? `Level ${profile.level}${profile.levelTitle ? ` · ${profile.levelTitle}` : ""}` : "";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={styles.pageTitle} accessibilityRole="header">
          Profile
        </Text>

        {profileQuery.isLoading ? (
          <View style={styles.pad}>
            <View style={styles.profileHeader} accessible accessibilityLabel="Loading profile">
              <Skeleton width={76} height={76} radius={38} />
              <View style={{ flex: 1, gap: SPACING.sm }}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="45%" height={14} />
              </View>
            </View>
            <Skeleton height={8} />
          </View>
        ) : !profile ? (
          <View style={styles.pad}>
            <ErrorState
              title="Couldn't load your profile"
              error={profileQuery.error}
              retrying={profileQuery.isFetching}
              onRetry={() => void profileQuery.refetch()}
            />
          </View>
        ) : (
          <>
            {/* Identity + level (read-only, except the avatar) */}
            <View style={styles.pad}>
              <View style={styles.profileHeader}>
                <AvatarRing profile={profile} avatar={avatar} busy={photoBusy} onPress={onAvatarPress} />
                <View style={styles.userInfo}>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.email ?? "Your account"}
                  </Text>
                  <Text style={styles.levelLine} maxFontSizeMultiplier={1.6}>
                    {levelLine}
                  </Text>
                </View>
              </View>
              <XPBar
                currentXP={profile.xpIntoLevel}
                neededXP={profile.xpNeeded}
                level={profile.level}
                title={profile.levelTitle}
                showDetails={false}
                style={styles.xpBar}
              />
              <View style={styles.xpMeta}>
                <Text style={styles.xpMetaText}>
                  {profile.xpNeeded == null
                    ? "Max level reached"
                    : `${xpRemaining.toLocaleString()} XP to Level ${profile.level + 1}`}
                </Text>
                {profile.xpNeeded != null && (
                  <Text style={styles.xpMetaText}>
                    {profile.xpIntoLevel.toLocaleString()} / {profile.xpNeeded.toLocaleString()} XP
                  </Text>
                )}
              </View>

              {/* Stats: plain numbers, not buttons */}
              <View style={styles.statsRow}>
                {[
                  { value: String(profile.loginStreak), label: "Streak", a11y: plural(profile.loginStreak, "day") },
                  { value: String(profile.longestStreak), label: "Best streak", a11y: plural(profile.longestStreak, "day") },
                  {
                    value: `${profile.achievementCount}${profile.achievementTotal ? `/${profile.achievementTotal}` : ""}`,
                    label: "Badges",
                    a11y: undefined
                  },
                  { value: profile.totalXP.toLocaleString(), label: "Total XP", a11y: undefined }
                ].map(({ value, label, a11y }) => (
                  <View key={label} style={styles.stat} accessible accessibilityLabel={`${label}: ${a11y ?? value}`}>
                    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.4}>
                      {value}
                    </Text>
                    <Text style={styles.statLabel} maxFontSizeMultiplier={1.4}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Streak */}
            <SectionLabel>Streak</SectionLabel>
            <SettingsRow
              icon={<CheckCircle2 size={22} color={checkedInToday ? COLORS.success : COLORS.textSecondary} />}
              title="Daily check-in"
              subtitle={
                needsFirstHabit
                  ? "Add your first habit to start your streak"
                  : checkedInToday
                    ? `Checked in today ✓${
                        nextMilestone
                          ? ` · ${plural(nextMilestone - profile.loginStreak, "more day")} to a ${nextMilestone}-day streak`
                          : ""
                      }`
                    : profile.loginStreak > 0
                      ? `${plural(profile.loginStreak, "day")} in a row · check in to keep it`
                      : "Check in each day to build a streak and earn XP"
              }
              trailing={
                needsFirstHabit ? (
                  <RowButton
                    title="Create a habit"
                    tone="filled"
                    onPress={() => router.push("/habits/new", { withAnchor: true })}
                  />
                ) : checkedInToday ? null : (
                  <RowButton
                    title="Check in"
                    tone="filled"
                    loading={checkinMutation.isPending}
                    onPress={() => checkinMutation.mutate()}
                  />
                )
              }
            />
            <View
              style={styles.weekStrip}
              accessible
              accessibilityLabel={`This week: ${week.filter((d) => d.done).length} of 7 days checked in`}
            >
              {week.map((day) => (
                <View key={day.date} style={styles.weekDay}>
                  <View
                    style={[styles.weekDot, day.done && styles.weekDotDone, day.isToday && !day.done && styles.weekDotToday]}
                  />
                  <Text style={[styles.weekLabel, day.isToday && styles.weekLabelToday]} maxFontSizeMultiplier={1.3}>
                    {day.isToday ? "Today" : weekdayShort(day.date)}
                  </Text>
                </View>
              ))}
            </View>
            <RowDivider />
            <SettingsRow
              icon={<Text style={styles.rowEmoji} maxFontSizeMultiplier={1.3}>🛡️</Text>}
              title={plural(freezes, "freeze")}
              subtitle={
                gems >= FREEZE_COST
                  ? "Covers a missed day, or repairs a habit's broken streak"
                  : `Covers a missed day · need ${FREEZE_COST} 💎 (you have ${gems})`
              }
              accessibilityLabel={`You have ${plural(freezes, "streak freeze")}`}
              trailing={
                <RowButton
                  title={`Buy · ${FREEZE_COST} 💎`}
                  accessibilityLabel={`Buy a streak freeze for ${FREEZE_COST} gems`}
                  disabled={gems < FREEZE_COST}
                  loading={freezeMutation.isPending}
                  onPress={() => freezeMutation.mutate()}
                />
              }
            />
            {showRestore && broken && (
              <>
                <RowDivider />
                <SettingsRow
                  icon={<RotateCcw size={22} color={COLORS.gem} />}
                  title={`Restore your ${plural(broken.previousStreak, "day")} streak`}
                  subtitle={
                    gems >= RESTORE_COST
                      ? restoreLeft
                        ? `${restoreLeft} left to restore it`
                        : "Available for a limited time"
                      : `Need ${RESTORE_COST} 💎 (you have ${gems})`
                  }
                  trailing={
                    <RowButton
                      title={`Restore · ${RESTORE_COST} 💎`}
                      accessibilityLabel={`Restore streak for ${RESTORE_COST} gems`}
                      tone="filled"
                      disabled={gems < RESTORE_COST}
                      loading={restoreMutation.isPending}
                      onPress={() => restoreMutation.mutate()}
                    />
                  }
                />
              </>
            )}

            {/* Share */}
            <SectionLabel>Share</SectionLabel>
            <SettingsRow
              icon={<Share2 size={22} color={COLORS.textSecondary} />}
              title="Share progress"
              subtitle="Send a card with your level and streak"
              accessory="chevron"
              loading={sharing}
              onPress={shareProgress}
            />
          </>
        )}

        {/* Settings */}
        <SectionLabel>Settings</SectionLabel>
        <SettingsRow
          icon={<Volume2 size={22} color={COLORS.textSecondary} />}
          title="Sound effects"
          subtitle="Chimes for XP, badges and level-ups"
          trailing={
            <Switch
              accessibilityLabel="Sound effects"
              value={soundOn}
              onValueChange={(value) => {
                hapticLight();
                setSoundOn(value);
              }}
              trackColor={{ false: COLORS.surfaceElevated, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          }
        />
        <RowDivider />
        <SettingsRow
          icon={<CircleHelp size={22} color={COLORS.textSecondary} />}
          title="How Pulse works"
          subtitle="Replay the short introduction"
          accessory="chevron"
          accessibilityHint="Replays the short introduction to habits, XP and streaks"
          onPress={openWalkthrough}
        />

        {canChangeServer && (
          <>
            <RowDivider />
            {isEditingApi ? (
              <View style={styles.inlineForm}>
                <Input
                  label="API base URL"
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="http://10.0.2.2:4000/api"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.buttonRow}>
                  <Button title="Save server" size="sm" onPress={handleSaveApiUrl} />
                  <Button title="Cancel" size="sm" variant="ghost" onPress={() => setIsEditingApi(false)} />
                </View>
              </View>
            ) : (
              <SettingsRow
                icon={<Server size={22} color={COLORS.textMuted} />}
                title="Server (testing only)"
                subtitle={apiUrl || "Not set"}
                accessory="chevron"
                accessibilityLabel="Change server"
                onPress={() => setIsEditingApi(true)}
              />
            )}
          </>
        )}

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <SettingsRow
          icon={<FileText size={22} color={COLORS.textSecondary} />}
          title="Privacy policy"
          accessory="external"
          accessibilityRole="link"
          accessibilityHint="Opens in your browser"
          onPress={() => void openLink(PRIVACY_POLICY_URL)}
        />
        <RowDivider />
        <SettingsRow
          icon={<LifeBuoy size={22} color={COLORS.textSecondary} />}
          title="Delete account help"
          accessory="external"
          accessibilityRole="link"
          accessibilityHint="Opens in your browser"
          onPress={() => void openLink(DELETE_ACCOUNT_HELP_URL)}
        />
        <RowDivider />
        <SettingsRow icon={<LogOut size={22} color={COLORS.textSecondary} />} title="Sign out" onPress={handleSignOut} />
        <RowDivider />
        {isDeleting ? (
          <View style={styles.inlineForm}>
            <Text style={styles.deleteTitle}>Delete account</Text>
            <Text style={styles.deleteBody}>
              This permanently removes your account and all of its data. Enter your password to confirm.
            </Text>
            <Input
              label="Current password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              containerStyle={styles.deleteInput}
            />
            <View style={styles.buttonRow}>
              <Button
                title="Delete account"
                variant="danger"
                onPress={handleDeleteAccount}
                loading={deleteMutation.isPending}
                style={styles.flex}
              />
              <Button
                title="Cancel"
                variant="ghost"
                disabled={deleteMutation.isPending}
                onPress={() => {
                  setIsDeleting(false);
                  setDeletePassword("");
                }}
              />
            </View>
          </View>
        ) : (
          <SettingsRow
            icon={<Trash2 size={22} color={COLORS.dangerText} />}
            title="Delete account"
            danger
            onPress={() => setIsDeleting(true)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl
  },
  pad: {
    paddingHorizontal: SPACING.lg
  },
  flex: {
    flex: 1
  },
  pageTitle: {
    ...TYPOGRAPHY.title1,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    gap: SPACING.lg
  },
  avatarInner: {
    ...StyleSheet.absoluteFillObject,
    margin: 9,
    borderRadius: 29,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29
  },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 8, 15, 0.55)",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center"
  },
  userInfo: {
    flex: 1,
    gap: 4
  },
  userEmail: {
    ...TYPOGRAPHY.title2
  },
  levelLine: {
    ...TYPOGRAPHY.bodySecondary
  },
  xpBar: {
    marginTop: SPACING.xs
  },
  xpMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.sm
  },
  xpMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  statsRow: {
    flexDirection: "row",
    marginTop: SPACING.xxl
  },
  stat: {
    flex: 1
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    fontVariant: ["tabular-nums"]
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: SPACING.lg + 24 + SPACING.lg,
    paddingRight: SPACING.lg,
    paddingBottom: SPACING.md
  },
  weekDay: {
    alignItems: "center",
    gap: 4,
    flex: 1
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceElevated
  },
  weekDotDone: {
    backgroundColor: COLORS.success
  },
  weekDotToday: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
    backgroundColor: "transparent"
  },
  weekLabel: {
    ...TYPOGRAPHY.micro
  },
  weekLabelToday: {
    color: COLORS.text
  },
  rowEmoji: {
    fontSize: 20
  },
  inlineForm: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md
  },
  deleteTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.dangerText
  },
  deleteBody: {
    ...TYPOGRAPHY.bodySecondary,
    marginTop: 4
  },
  deleteInput: {
    marginTop: SPACING.md
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.sm
  }
});
