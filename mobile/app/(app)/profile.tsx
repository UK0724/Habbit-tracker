import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  Flame,
  ShieldCheck,
  Trophy,
  Zap,
  CheckCircle2,
  Server,
  Share2,
  Volume2,
  ExternalLink,
  Trash2,
  RotateCcw,
  Award,
  Pencil,
  PlusCircle,
  CircleHelp
} from "lucide-react-native";
import { openWalkthrough } from "../../src/stores/onboardingStore";
import { shift } from "@habit-tracker/shared";
import { BORDER_RADIUS, COLORS, SPACING, TIER_COLORS, TYPOGRAPHY, levelTier } from "../../src/constants/theme";
import { DELETE_ACCOUNT_HELP_URL, PRIVACY_POLICY_URL, openLink } from "../../src/constants/links";
import { ProgressHeader } from "../../src/components/ProgressHeader";
import { LevelBadge } from "../../src/components/LevelBadge";
import { XPBar } from "../../src/components/XPBar";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
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
  const tier = TIER_COLORS[levelTier(profile.level)];
  return (
    <TouchableOpacity
      style={{ width: size, height: size }}
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.8}
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
        <Pencil size={11} color={COLORS.text} />
      </View>
      <View style={[styles.levelChip, { backgroundColor: tier.bg, borderColor: tier.border }]}>
        <Text style={[styles.levelChipText, { color: tier.fg }]} maxFontSizeMultiplier={1.2}>
          {profile.level}
        </Text>
      </View>
    </TouchableOpacity>
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
          <Card style={styles.block}>
            <View style={styles.profileHeader} accessible accessibilityLabel="Loading profile">
              <Skeleton width={76} height={76} radius={38} />
              <View style={{ flex: 1, gap: SPACING.sm }}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="45%" height={22} radius={11} />
              </View>
            </View>
            <Skeleton height={10} />
          </Card>
        ) : !profile ? (
          <Card style={styles.block}>
            <ErrorState
              title="Couldn't load your profile"
              error={profileQuery.error}
              retrying={profileQuery.isFetching}
              onRetry={() => void profileQuery.refetch()}
            />
          </Card>
        ) : (
          <>
            {/* Identity + level */}
            <Card style={styles.block}>
              <View style={styles.profileHeader}>
                <AvatarRing profile={profile} avatar={avatar} busy={photoBusy} onPress={onAvatarPress} />
                <View style={styles.userInfo}>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.email ?? "Your account"}
                  </Text>
                  <LevelBadge level={profile.level} title={profile.levelTitle} size="sm" />
                </View>
              </View>
              <XPBar
                currentXP={profile.xpIntoLevel}
                neededXP={profile.xpNeeded}
                level={profile.level}
                title={profile.levelTitle}
                showDetails
              />
              <Button
                title="Share progress"
                variant="secondary"
                icon={<Share2 size={16} color={COLORS.text} />}
                loading={sharing}
                onPress={shareProgress}
                fullWidth
                style={styles.shareButton}
              />
            </Card>

            {/* Daily check-in */}
            <Card style={styles.block}>
              <View style={styles.rowHeader}>
                <View style={[styles.iconBubble, { backgroundColor: COLORS.successLight }]}>
                  <CheckCircle2 size={22} color={COLORS.success} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Daily check-in</Text>
                  <Text style={styles.cardSubtitle}>
                    {profile.loginStreak > 0
                      ? `${plural(profile.loginStreak, "day")} in a row · best ${plural(profile.longestStreak, "day")}`
                      : "Check in each day to build a streak and earn XP."}
                  </Text>
                </View>
              </View>
              <View style={styles.weekStrip} accessible accessibilityLabel={`This week: ${week.filter((d) => d.done).length} of 7 days checked in`}>
                {week.map((day) => (
                  <View key={day.date} style={styles.weekDay}>
                    <View
                      style={[
                        styles.weekDot,
                        day.done && styles.weekDotDone,
                        day.isToday && !day.done && styles.weekDotToday
                      ]}
                    >
                      {day.done ? <Flame size={12} color={COLORS.onSuccess} fill={COLORS.onSuccess} /> : null}
                    </View>
                    <Text style={[styles.weekLabel, day.isToday && styles.weekLabelToday]}>
                      {day.isToday ? "Today" : weekdayShort(day.date)}
                    </Text>
                  </View>
                ))}
              </View>
              {nextMilestone && (
                <Text style={styles.milestone}>
                  {plural(nextMilestone - profile.loginStreak, "more day")} to a {nextMilestone}-day streak
                </Text>
              )}
              {needsFirstHabit ? (
                <>
                  <Text style={styles.firstHabitText}>Add your first habit to start your streak</Text>
                  <Button
                    title="Create a habit"
                    icon={<PlusCircle size={16} color={COLORS.white} />}
                    onPress={() => router.push("/habits/new", { withAnchor: true })}
                    fullWidth
                  />
                </>
              ) : (
                <Button
                  title={checkedInToday ? "Checked in ✓ — back tomorrow" : "Check in"}
                  variant={checkedInToday ? "secondary" : "success"}
                  disabled={checkedInToday}
                  loading={checkinMutation.isPending}
                  onPress={() => checkinMutation.mutate()}
                  fullWidth
                />
              )}
            </Card>

            {/* Streak restore */}
            {showRestore && broken && (
              <Card style={[styles.block, styles.restoreCard]}>
                <View style={styles.rowHeader}>
                  <View style={[styles.iconBubble, { backgroundColor: COLORS.gemLight }]}>
                    <RotateCcw size={22} color={COLORS.gem} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>Restore your {plural(broken.previousStreak, "day")} streak</Text>
                    <Text style={styles.cardSubtitle}>
                      {restoreLeft ? `${restoreLeft} left to restore it.` : "Available for a limited time."}
                    </Text>
                  </View>
                </View>
                <Button
                  title={gems >= RESTORE_COST ? `Restore for ${RESTORE_COST} 💎` : `Need ${RESTORE_COST} 💎 (you have ${gems})`}
                  disabled={gems < RESTORE_COST}
                  loading={restoreMutation.isPending}
                  onPress={() => restoreMutation.mutate()}
                  fullWidth
                />
              </Card>
            )}

            {/* Streak freeze shop */}
            <Card style={styles.block}>
              <View style={styles.rowHeader}>
                <View style={[styles.iconBubble, { backgroundColor: COLORS.frozenLight }]}>
                  <ShieldCheck size={22} color={COLORS.frozen} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Streak freeze</Text>
                  <View
                    style={styles.freezeCountRow}
                    accessible
                    accessibilityLabel={`You have ${plural(freezes, "streak freeze")}`}
                  >
                    <Text style={styles.freezeCount} maxFontSizeMultiplier={1.3}>
                      {freezes}
                    </Text>
                    <Text style={styles.freezeCountLabel} maxFontSizeMultiplier={1.3}>
                      {freezes === 1 ? "freeze" : "freezes"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.freezeInfo}>
                <Text style={styles.freezeInfoLine}>
                  🛡️ Covers one missed check-in day automatically, so your daily streak survives.
                </Text>
                <Text style={styles.freezeInfoLine}>
                  ❄️ Or repairs a habit's broken streak: tap "Repair" on that habit.
                </Text>
              </View>
              <Button
                title={gems >= FREEZE_COST ? `Buy a freeze · ${FREEZE_COST} 💎` : `Need ${FREEZE_COST} 💎 (you have ${gems})`}
                variant="secondary"
                disabled={gems < FREEZE_COST}
                loading={freezeMutation.isPending}
                onPress={() => freezeMutation.mutate()}
                fullWidth
              />
            </Card>

            {/* Stats */}
            <Card style={[styles.block, styles.statsGrid]}>
              {[
                { Icon: Flame, color: COLORS.streak, value: plural(profile.longestStreak, "day"), label: "Longest streak" },
                {
                  Icon: Trophy,
                  color: COLORS.gold,
                  value: `${profile.achievementCount}${profile.achievementTotal ? ` / ${profile.achievementTotal}` : ""}`,
                  label: "Badges",
                  onPress: () => router.push("/(app)/achievements")
                },
                { Icon: Award, color: TIER_COLORS[levelTier(profile.level)].fg, value: String(profile.level), label: "Level" },
                { Icon: Zap, color: COLORS.xpText, value: profile.totalXP.toLocaleString(), label: "Total XP" }
              ].map(({ Icon, color, value, label, onPress }) => (
                <TouchableOpacity
                  key={label}
                  style={styles.statCard}
                  disabled={!onPress}
                  onPress={onPress}
                  accessibilityRole={onPress ? "button" : "text"}
                  accessibilityLabel={`${label}: ${value}`}
                >
                  <Icon size={20} color={color} />
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                    {value}
                  </Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          </>
        )}

        {/* Settings */}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Settings
        </Text>
        <Card style={styles.block} padding="md">
          <View style={styles.settingRow}>
            <Volume2 size={20} color={COLORS.textSecondary} />
            <View style={styles.flex}>
              <Text style={styles.settingLabel}>Sound effects</Text>
              <Text style={styles.cardSubtitle}>Chimes for XP, badges and level-ups</Text>
            </View>
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
          </View>
        </Card>

        {canChangeServer && (
          <Card style={styles.block} padding="md">
            <View style={styles.settingRow}>
              <Server size={18} color={COLORS.textMuted} />
              <Text style={[styles.settingLabel, styles.flex]}>Server (testing only)</Text>
            </View>
            {isEditingApi ? (
              <View style={styles.apiEditBox}>
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
              <View style={styles.apiDisplayRow}>
                <Text style={styles.apiUrlText} numberOfLines={1}>
                  {apiUrl || "Not set"}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditingApi(true)}
                  style={styles.inlineButton}
                  accessibilityRole="button"
                  accessibilityLabel="Change server"
                >
                  <Text style={styles.inlineButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}

        {/* Account */}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Account
        </Text>
        <Card style={styles.block} padding="md">
          <TouchableOpacity
            style={styles.linkRow}
            accessibilityRole="button"
            accessibilityHint="Replays the short introduction to habits, XP and streaks"
            onPress={openWalkthrough}
          >
            <Text style={styles.settingLabel}>How Pulse works</Text>
            <CircleHelp size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            accessibilityRole="link"
            accessibilityHint="Opens in your browser"
            onPress={() => void openLink(PRIVACY_POLICY_URL)}
          >
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <ExternalLink size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.linkRow}
            accessibilityRole="link"
            accessibilityHint="Opens in your browser"
            onPress={() => void openLink(DELETE_ACCOUNT_HELP_URL)}
          >
            <Text style={styles.settingLabel}>Delete account help</Text>
            <ExternalLink size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkRow} accessibilityRole="button" onPress={handleSignOut}>
            <Text style={styles.settingLabel}>Sign out</Text>
            <LogOut size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          {isDeleting ? (
            <View style={styles.deleteBox}>
              <Text style={styles.deleteTitle}>Delete account</Text>
              <Text style={styles.cardSubtitle}>
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
            <TouchableOpacity style={styles.linkRow} accessibilityRole="button" onPress={() => setIsDeleting(true)}>
              <Text style={[styles.settingLabel, styles.dangerText]}>Delete account</Text>
              <Trash2 size={16} color={COLORS.dangerText} />
            </TouchableOpacity>
          )}
        </Card>
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
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl
  },
  flex: {
    flex: 1
  },
  pageTitle: {
    ...TYPOGRAPHY.title1,
    marginBottom: SPACING.md
  },
  block: {
    marginBottom: SPACING.md
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    gap: SPACING.md
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
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center"
  },
  firstHabitText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md
  },
  freezeCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2
  },
  freezeCount: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: COLORS.frozen,
    fontVariant: ["tabular-nums"]
  },
  freezeCountLabel: {
    ...TYPOGRAPHY.title3,
    color: COLORS.frozen
  },
  freezeInfo: {
    gap: 4,
    marginBottom: SPACING.md
  },
  freezeInfoLine: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  levelChip: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    minWidth: 28,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: "800"
  },
  userInfo: {
    flex: 1,
    gap: 6
  },
  userEmail: {
    ...TYPOGRAPHY.title3
  },
  shareButton: {
    marginTop: SPACING.md
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: {
    ...TYPOGRAPHY.title3
  },
  cardSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm
  },
  weekDay: {
    alignItems: "center",
    gap: 4,
    flex: 1
  },
  weekDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center"
  },
  weekDotDone: {
    backgroundColor: COLORS.success
  },
  weekDotToday: {
    borderWidth: 2,
    borderColor: COLORS.success
  },
  weekLabel: {
    ...TYPOGRAPHY.micro
  },
  weekLabelToday: {
    color: COLORS.text
  },
  milestone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.streak,
    textAlign: "center",
    marginBottom: SPACING.md
  },
  restoreCard: {
    borderWidth: 1,
    borderColor: COLORS.gemBorder
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: SPACING.lg
  },
  statCard: {
    width: "50%",
    paddingHorizontal: SPACING.sm,
    minHeight: 44
  },
  statValue: {
    ...TYPOGRAPHY.title2,
    marginTop: SPACING.xs
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    minHeight: 48
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: "600"
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border
  },
  dangerText: {
    color: COLORS.dangerText
  },
  deleteBox: {
    paddingVertical: SPACING.sm
  },
  deleteTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.dangerText
  },
  deleteInput: {
    marginTop: SPACING.md
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.sm
  },
  apiEditBox: {
    marginTop: SPACING.sm
  },
  apiDisplayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingLeft: 12,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm
  },
  apiUrlText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1
  },
  inlineButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: SPACING.md
  },
  inlineButtonText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primaryText
  }
});
