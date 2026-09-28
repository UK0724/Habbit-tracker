import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gem,
  HeartPulse,
  PenLine,
  Shield,
  Snowflake,
  Sparkles,
  Zap
} from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TIER_COLORS, TYPOGRAPHY } from "../constants/theme";
import { Button } from "./Button";
import { LevelBadge } from "./LevelBadge";
import { useReduceMotion } from "../hooks/useReduceMotion";
import { useHabitsList } from "../hooks/useHabitsList";
import { errorMessage as describeError, habitApi } from "../services/api";
import { getItemAsync, setItemAsync } from "../services/storage";
import { useAuthStore } from "../stores/authStore";
import { useCelebrationStore } from "../stores/achievementStore";
import { useOnboardingStore } from "../stores/onboardingStore";
import { useLocalDate } from "../utils/date";
import { hapticError, hapticSuccess } from "../utils/haptics";
import {
  HABIT_TEMPLATES,
  WALKTHROUGH_STEP_COUNT,
  clampStep,
  countTrackableHabits,
  habitCreatedToast,
  onboardingSeenKey,
  shouldAutoShowWalkthrough,
  stepFromOffset,
  templateAlreadyAdded,
  templatePayload,
  walkthroughVisible,
  type HabitTemplate,
  type SeenStatus
} from "../utils/onboarding";

const STEP_TITLES = [
  "Welcome to Pulse",
  "Earn XP & level up",
  "Protect your streak 🔥",
  "Create your first habit"
] as const;

/** Lets the Today screen settle (and any check-in reward queue up) first. */
const AUTO_OPEN_DELAY_MS = 700;

// ─────────────────────────────── Host ───────────────────────────────

/**
 * Decides when the walkthrough shows: once per account on first run (zero
 * habits, not seen), or whenever it is replayed. It waits while a
 * celebration modal or the streak-lost sheet is up, then comes back.
 */
export function WalkthroughHost() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const today = useLocalDate();
  // Same cache entry as Today, Habits and reminder scheduling.
  const habitsQuery = useHabitsList(today, !!userId);
  const celebrationActive = useCelebrationStore((state) => state.current != null);
  const requested = useOnboardingStore((state) => state.requested);
  const openId = useOnboardingStore((state) => state.openId);
  const shownThisSession = useOnboardingStore((state) =>
    userId ? state.sessionSeen.includes(userId) : false
  );

  // ── "Seen" flag, per account ──
  const [seen, setSeen] = useState<{ userId: string; status: SeenStatus } | null>(null);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setSeen({ userId, status: "loading" });
    getItemAsync(onboardingSeenKey(userId))
      .then((value) => {
        if (active) setSeen({ userId, status: value ? "seen" : "unseen" });
      })
      .catch((error) => {
        // Storage unavailable: fall back to once per app session.
        console.error("[walkthrough] Could not read the seen flag", error);
        if (active) setSeen({ userId, status: "unseen" });
      });
    return () => {
      active = false;
    };
  }, [userId]);
  const seenStatus: SeenStatus = seen && seen.userId === userId ? seen.status : "loading";

  const habits = habitsQuery.data;
  const habitsReady = habitsQuery.isSuccess && !habitsQuery.isPlaceholderData;
  const autoShowInput = {
    userId,
    habitsReady,
    trackableHabits: countTrackableHabits(habits),
    seen: seenStatus,
    shownThisSession,
    celebrationActive,
    alreadyOpen: requested,
    onToday: pathname === "/"
  };
  const autoShow = shouldAutoShowWalkthrough(autoShowInput);
  const latestInput = useRef(autoShowInput);
  latestInput.current = autoShowInput;

  useEffect(() => {
    if (!autoShow || !userId) return;
    const timer = setTimeout(() => {
      // Re-check: a celebration or navigation may have happened meanwhile.
      if (!shouldAutoShowWalkthrough(latestInput.current)) return;
      const store = useOnboardingStore.getState();
      store.markSessionSeen(userId);
      store.open();
    }, AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoShow, userId]);

  // ── Step (kept here so a celebration interrupting the modal keeps it) ──
  // Every open (first run or replay) starts at step 1.
  const [stepState, setStepState] = useState({ openId, step: 0 });
  const step = stepState.openId === openId ? stepState.step : 0;
  const setStep = useCallback((next: number) => setStepState({ openId, step: next }), [openId]);

  const markSeen = useCallback(() => {
    if (!userId) return;
    useOnboardingStore.getState().markSessionSeen(userId);
    setSeen({ userId, status: "seen" });
    setItemAsync(onboardingSeenKey(userId), "1").catch((error) =>
      console.error("[walkthrough] Could not save the seen flag", error)
    );
  }, [userId]);

  const finish = useCallback(() => {
    useOnboardingStore.getState().close();
    markSeen();
  }, [markSeen]);

  // ── One-tap templates ──
  const [createError, setCreateError] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const creating = useRef(false);
  useEffect(() => {
    setCreateError(null);
  }, [openId, userId]);

  const createMutation = useMutation({
    mutationFn: ({ template }: { template: HabitTemplate; habitsBefore: number; userId: string }) =>
      habitApi.create(templatePayload(template)),
    onSuccess: async (_habit, { template, habitsBefore, userId: creator }) => {
      // Signed out or switched accounts while saving: nothing to show.
      if (useAuthStore.getState().user?.id !== creator) return;
      void hapticSuccess();
      finish();
      void queryClient.invalidateQueries({ queryKey: ["habits"] });
      // The first habit performs today's check-in server-side (streak Day 1).
      void queryClient.invalidateQueries({ queryKey: ["gamificationProfile"] });
      void queryClient.invalidateQueries({ queryKey: ["achievements"] });
      useCelebrationStore.getState().enqueue({
        kind: "xp",
        xp: 0,
        gems: 0,
        legendaryDay: false,
        checkin: null,
        message: habitCreatedToast(habitsBefore, template.title)
      });
    },
    onError: (error: unknown, { userId: creator }) => {
      if (useAuthStore.getState().user?.id !== creator) return;
      void hapticError();
      const message = describeError(
        error,
        "Couldn't create the habit. Check your connection and try again."
      );
      setCreateError(message);
      AccessibilityInfo.announceForAccessibility(message);
    },
    onSettled: () => {
      creating.current = false;
      setPendingTemplate(null);
    }
  });

  const createTemplate = useCallback(
    (template: HabitTemplate) => {
      if (creating.current || !userId) return;
      creating.current = true;
      setCreateError(null);
      setPendingTemplate(template.id);
      createMutation.mutate({
        template,
        // The server counts every habit (archived and expense ones too).
        habitsBefore: Array.isArray(habits) ? habits.length : 0,
        userId
      });
    },
    [createMutation, habits, userId]
  );

  const createOwn = useCallback(() => {
    finish();
    // Let the modal start closing before the form screen is pushed.
    setTimeout(() => router.push("/habits/new", { withAnchor: true }), 0);
  }, [finish, router]);

  const addedIds = HABIT_TEMPLATES.filter((template) =>
    templateAlreadyAdded(habits, template)
  ).map((template) => template.id);

  return (
    <Walkthrough
      key={openId}
      visible={walkthroughVisible(requested, celebrationActive)}
      step={step}
      onStepChange={setStep}
      onClose={finish}
      onTemplate={createTemplate}
      onCreateOwn={createOwn}
      pendingTemplate={pendingTemplate}
      addedIds={addedIds}
      createError={createError}
    />
  );
}

// ─────────────────────────────── Modal ───────────────────────────────

type WalkthroughProps = {
  visible: boolean;
  step: number;
  onStepChange: (step: number) => void;
  /** Skip, Done, Android back: all close it and mark it seen. */
  onClose: () => void;
  onTemplate: (template: HabitTemplate) => void;
  onCreateOwn: () => void;
  pendingTemplate: string | null;
  addedIds: string[];
  createError: string | null;
};

function Walkthrough({
  visible,
  step,
  onStepChange,
  onClose,
  onTemplate,
  onCreateOwn,
  pendingTemplate,
  addedIds,
  createError
}: WalkthroughProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const pagerRef = useRef<ScrollView>(null);
  const current = clampStep(step);
  const isLast = current === WALKTHROUGH_STEP_COUNT - 1;

  const scrollToStep = useCallback(
    (index: number, animated: boolean) => {
      pagerRef.current?.scrollTo({ x: clampStep(index) * width, y: 0, animated });
    },
    [width]
  );

  const goTo = useCallback(
    (index: number) => {
      const next = clampStep(index);
      onStepChange(next);
      scrollToStep(next, !reduceMotion);
    },
    [onStepChange, scrollToStep, reduceMotion]
  );

  // Rotation / window resize: keep the current page aligned.
  const stepRef = useRef(current);
  stepRef.current = current;
  useEffect(() => {
    scrollToStep(stepRef.current, false);
  }, [width, scrollToStep]);

  // Announce every step change (and the first step on open) to screen readers.
  useEffect(() => {
    if (!visible) return;
    AccessibilityInfo.announceForAccessibility(
      `Step ${current + 1} of ${WALKTHROUGH_STEP_COUNT}. ${STEP_TITLES[current].replace(/[🔥]/gu, "").trim()}`
    );
  }, [current, visible]);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = stepFromOffset(event.nativeEvent.contentOffset.x, width);
    if (next !== current) onStepChange(next);
  };

  const busy = pendingTemplate != null;

  const pages = [
    <WelcomeStep key="welcome" />,
    <XpStep key="xp" active={visible && current === 1} reduceMotion={reduceMotion} />,
    <StreakStep key="streak" />,
    <FirstHabitStep
      key="first"
      onTemplate={onTemplate}
      onCreateOwn={onCreateOwn}
      pendingTemplate={pendingTemplate}
      addedIds={addedIds}
      createError={createError}
    />
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        accessibilityViewIsModal
        style={[
          styles.root,
          {
            paddingTop: insets.top + SPACING.sm,
            paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.sm,
            paddingLeft: insets.left,
            paddingRight: insets.right
          }
        ]}
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.stepLabel} maxFontSizeMultiplier={1.4}>
            Step {current + 1} of {WALKTHROUGH_STEP_COUNT}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Skip walkthrough"
            accessibilityHint="Closes the introduction. You can replay it from Profile."
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={styles.skipButton}
          >
            <Text style={styles.skipText} maxFontSizeMultiplier={1.4}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Pages ── */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumEnd}
          onLayout={() => scrollToStep(stepRef.current, false)}
          style={styles.pager}
        >
          {pages.map((page, index) => (
            <View
              key={index}
              style={{ width }}
              importantForAccessibility={index === current ? "auto" : "no-hide-descendants"}
              accessibilityElementsHidden={index !== current}
            >
              <ScrollView
                contentContainerStyle={styles.pageContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.6}>
                  {STEP_TITLES[index]}
                </Text>
                {page}
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        {/* ── Dots ── */}
        <View style={styles.dots} accessibilityRole="tablist">
          {STEP_TITLES.map((title, index) => {
            const selected = index === current;
            return (
              <TouchableOpacity
                key={title}
                onPress={() => goTo(index)}
                accessibilityRole="tab"
                accessibilityLabel={`Step ${index + 1} of ${WALKTHROUGH_STEP_COUNT}: ${title.replace(/[🔥]/gu, "").trim()}`}
                accessibilityState={{ selected }}
                hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
                style={styles.dotTouch}
              >
                <View style={[styles.dot, selected && styles.dotActive]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {current > 0 ? (
            <Button
              title="Back"
              variant="ghost"
              icon={<ChevronLeft size={18} color={COLORS.primaryText} />}
              onPress={() => goTo(current - 1)}
              accessibilityLabel="Previous step"
              style={styles.footerButton}
            />
          ) : (
            <View style={styles.footerButton} />
          )}
          {isLast ? (
            <Button
              title="Maybe later"
              variant="secondary"
              disabled={busy}
              onPress={onClose}
              accessibilityHint="Closes the introduction"
              style={styles.footerButton}
            />
          ) : (
            <Button
              title={current === 0 ? "Get started" : "Next"}
              icon={<ChevronRight size={18} color={COLORS.white} />}
              iconPosition="right"
              onPress={() => goTo(current + 1)}
              accessibilityLabel="Next step"
              style={styles.footerButton}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────── Steps ───────────────────────────────

function Hero({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <View style={[styles.hero, { backgroundColor: color }]} importantForAccessibility="no-hide-descendants">
      {children}
    </View>
  );
}

function WelcomeStep() {
  return (
    <>
      <Hero color={COLORS.primaryLight}>
        <HeartPulse size={56} color={COLORS.primaryText} />
      </Hero>
      <Text style={styles.lead} maxFontSizeMultiplier={1.8}>
        Build habits that stick — one tap a day.
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.8}>
        Pick a few small habits, check them off on the Today screen, and watch your progress grow.
      </Text>
    </>
  );
}

function XpStep({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  const fill = useRef(new Animated.Value(reduceMotion ? 0.65 : 0)).current;
  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      fill.setValue(0.65);
      return;
    }
    fill.setValue(0);
    const animation = Animated.timing(fill, {
      toValue: 0.65,
      duration: 900,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    });
    animation.start();
    return () => animation.stop();
  }, [active, reduceMotion, fill]);
  const bronze = TIER_COLORS.bronze;

  return (
    <>
      <View
        style={styles.sampleCard}
        accessible
        accessibilityLabel="Example: level 1, 65 of 100 XP to the next level, and a bronze badge worth 1 gem"
      >
        <View style={styles.sampleRow}>
          <LevelBadge level={1} title="Beginner" />
          <Text style={styles.sampleXp} maxFontSizeMultiplier={1.4}>
            65 / 100 XP
          </Text>
        </View>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.trackFill,
              { width: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }
            ]}
          />
        </View>
        <View style={[styles.sampleBadge, { backgroundColor: bronze.bg, borderColor: bronze.border }]}>
          <Text style={styles.sampleBadgeEmoji}>🏅</Text>
          <View style={styles.flex}>
            <Text style={[styles.sampleBadgeTitle, { color: bronze.fg }]} maxFontSizeMultiplier={1.4}>
              Badge unlocked
            </Text>
            <Text style={styles.caption} maxFontSizeMultiplier={1.4}>
              Bronze · +1 💎 · bonus XP
            </Text>
          </View>
        </View>
      </View>
      <FactRow
        icon={<Zap size={20} color={COLORS.xpText} />}
        tint={COLORS.xpLight}
        title="+10 XP per habit"
        text="Measurable habits earn 5–15 XP depending on how close you get to your goal."
      />
      <FactRow
        icon={<Sparkles size={20} color={COLORS.gold} />}
        tint={COLORS.goldLight}
        title="+25 XP Legendary Day"
        text="Complete everything due today for a bonus. Badges add bonus XP and gems."
      />
    </>
  );
}

function StreakStep() {
  return (
    <>
      <FactRow
        icon={<Flame size={20} color={COLORS.streak} />}
        tint={COLORS.streakLight}
        title="Your streak starts with your first habit"
        text="Open Pulse and check in each day to keep it going. Streak milestones and badges earn 💎 gems."
      />
      <FactRow
        icon={<Shield size={20} color={COLORS.gem} />}
        tint={COLORS.gemLight}
        title="🛡️ Streak freeze — 2 gems"
        text="Covers one missed check-in day automatically, so a busy day doesn't reset your streak."
      />
      <FactRow
        icon={<Snowflake size={20} color={COLORS.frozen} />}
        tint={COLORS.frozenLight}
        title="❄️ Repair a habit"
        text="Missed a habit? Repair its streak within 2 days for 1 freeze or 3 gems. That day shows as Frozen ❄️."
      />
      <FactRow
        icon={<Gem size={20} color={COLORS.gem} />}
        tint={COLORS.gemLight}
        title="Earn gems"
        text="Badges give 1–5 gems by tier, and streak milestones add more."
      />
    </>
  );
}

function FirstHabitStep({
  onTemplate,
  onCreateOwn,
  pendingTemplate,
  addedIds,
  createError
}: {
  onTemplate: (template: HabitTemplate) => void;
  onCreateOwn: () => void;
  pendingTemplate: string | null;
  addedIds: string[];
  createError: string | null;
}) {
  const busy = pendingTemplate != null;
  return (
    <>
      <Text style={styles.body} maxFontSizeMultiplier={1.8}>
        Tap a starter habit to add it now, or make your own. You can edit it anytime.
      </Text>
      {HABIT_TEMPLATES.map((template) => {
        const added = addedIds.includes(template.id);
        const loading = pendingTemplate === template.id;
        const disabled = busy || added;
        return (
          <TouchableOpacity
            key={template.id}
            onPress={() => onTemplate(template)}
            disabled={disabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Add habit: ${template.title}`}
            accessibilityHint={added ? undefined : `${template.subtitle.replace(/·/g, ",")}`}
            accessibilityState={{ disabled, busy: loading, checked: added }}
            style={[styles.template, { borderColor: template.color }, disabled && !loading && styles.dimmed]}
          >
            <Text style={styles.templateEmoji}>{template.emoji}</Text>
            <View style={styles.flex}>
              <Text style={styles.templateTitle} maxFontSizeMultiplier={1.6}>
                {template.title}
              </Text>
              <Text style={styles.caption} maxFontSizeMultiplier={1.6}>
                {added ? "Already in your habits" : template.subtitle}
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator color={COLORS.primaryText} />
            ) : added ? (
              <Check size={20} color={COLORS.success} />
            ) : (
              <View style={[styles.addPill, { backgroundColor: template.color }]}>
                <Text style={styles.addPillText} maxFontSizeMultiplier={1.3}>
                  Add
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
      {createError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.8}>
          {createError}
        </Text>
      ) : null}
      <Button
        title="Create my own"
        variant="outline"
        icon={<PenLine size={16} color={COLORS.primaryText} />}
        onPress={onCreateOwn}
        disabled={busy}
        accessibilityHint="Opens the new habit form"
        fullWidth
        style={styles.ownButton}
      />
    </>
  );
}

function FactRow({
  icon,
  tint,
  title,
  text
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.fact} accessible accessibilityLabel={`${title}. ${text}`}>
      <View style={[styles.factIcon, { backgroundColor: tint }]}>{icon}</View>
      <View style={styles.flex}>
        <Text style={styles.factTitle} maxFontSizeMultiplier={1.8}>
          {title}
        </Text>
        <Text style={styles.factText} maxFontSizeMultiplier={1.8}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    minHeight: 44
  },
  stepLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    flexShrink: 1
  },
  skipButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "flex-end"
  },
  skipText: {
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: "600"
  },
  pager: {
    flex: 1
  },
  pageContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md
  },
  title: {
    ...TYPOGRAPHY.hero,
    marginBottom: SPACING.xs
  },
  hero: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.lg
  },
  lead: {
    ...TYPOGRAPHY.title2,
    lineHeight: 26
  },
  body: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 15,
    lineHeight: 22
  },
  caption: {
    ...TYPOGRAPHY.caption,
    lineHeight: 17
  },
  flex: {
    flex: 1
  },
  sampleCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xs
  },
  sampleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: SPACING.sm
  },
  sampleXp: {
    ...TYPOGRAPHY.label,
    color: COLORS.xpText
  },
  track: {
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    overflow: "hidden"
  },
  trackFill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.xp
  },
  sampleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md
  },
  sampleBadgeEmoji: {
    fontSize: 26
  },
  sampleBadgeTitle: {
    fontSize: 14,
    fontWeight: "700"
  },
  fact: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md
  },
  factIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  factTitle: {
    ...TYPOGRAPHY.title3,
    marginBottom: 2
  },
  factText: {
    ...TYPOGRAPHY.bodySecondary,
    lineHeight: 20
  },
  template: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    minHeight: 64,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.md
  },
  dimmed: {
    opacity: 0.6
  },
  templateEmoji: {
    fontSize: 26
  },
  templateTitle: {
    ...TYPOGRAPHY.title3
  },
  addPill: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6
  },
  addPillText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: "700"
  },
  error: {
    color: COLORS.dangerText,
    fontSize: 14,
    lineHeight: 20
  },
  ownButton: {
    marginTop: SPACING.xs
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.sm
  },
  dotTouch: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight
  },
  dotActive: {
    width: 22,
    backgroundColor: COLORS.primary
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xs
  },
  footerButton: {
    flex: 1
  }
});
