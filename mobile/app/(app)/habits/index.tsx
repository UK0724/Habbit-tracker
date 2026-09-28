import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, ChevronRight, Layers, Archive } from "lucide-react-native";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../../src/constants/theme";
import { ProgressHeader } from "../../../src/components/ProgressHeader";
import { Input } from "../../../src/components/Input";
import { StreakBadge } from "../../../src/components/StreakBadge";
import { Card } from "../../../src/components/Card";
import { Button } from "../../../src/components/Button";
import { CardSkeleton, ErrorState } from "../../../src/components/StateViews";
import { habitColor } from "../../../src/utils/habitColor";
import { formatGoal, formatSchedule } from "../../../src/utils/format";
import { useHabitsList } from "../../../src/hooks/useHabitsList";
import { useLocalDate } from "../../../src/utils/date";
import type { HabitListItem } from "@habit-tracker/shared";

type FilterType = "active" | "all" | "action" | "measurable" | "expense" | "archived";

const EMPTY_COPY: Record<FilterType, { title: string; body: string }> = {
  active: { title: "No active habits", body: "Create a habit to start earning XP." },
  all: { title: "No habits yet", body: "Create your first habit to start earning XP." },
  action: { title: "No check-off habits", body: "Action habits are simple \"did you do it?\" quests." },
  measurable: { title: "No measurable habits", body: "Track an amount like minutes, pages or steps." },
  expense: { title: "No expense habits", body: "Expense habits are set up on the web at habbit.abuk.in." },
  archived: { title: "Nothing archived", body: "Habits you archive show up here and can be restored." }
};

const TYPE_LABEL: Record<string, string> = {
  action: "Check off",
  measurable: "Measurable",
  expense: "Expense"
};

export default function HabitsListScreen() {
  const router = useRouter();
  const today = useLocalDate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [refreshing, setRefreshing] = useState(false);
  const habitsQuery = useHabitsList(today);
  const habits = habitsQuery.data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await habitsQuery.refetch();
    setRefreshing(false);
  };

  const filteredHabits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return habits.filter((habit: HabitListItem) => {
      if (query) {
        const matchesTitle = habit.title.toLowerCase().includes(query);
        const matchesDesc = habit.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      switch (activeFilter) {
        case "active":
          return !habit.archived;
        case "archived":
          return habit.archived;
        case "action":
        case "measurable":
        case "expense":
          return !habit.archived && habit.type === activeFilter;
        default:
          return true;
      }
    });
  }, [habits, searchQuery, activeFilter]);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "all", label: "All" },
    { key: "action", label: "Check off" },
    { key: "measurable", label: "Measurable" },
    { key: "expense", label: "Expense" },
    { key: "archived", label: "Archived" }
  ];
  const activeCount = habits.filter((h) => !h.archived).length;
  const empty = searchQuery.trim()
    ? { title: "No matches", body: `Nothing matches "${searchQuery.trim()}". Try another word.` }
    : EMPTY_COPY[activeFilter];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Habits
            </Text>
            <Text style={styles.headerSubtitle}>
              {habitsQuery.isSuccess ? `${activeCount} active` : " "}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="New habit"
            onPress={() => router.push("/habits/new")}
          >
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Input
            placeholder="Search habits"
            accessibilityLabel="Search habits"
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={18} color={COLORS.textMuted} />}
            containerStyle={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            keyboardShouldPersistTaps="handled"
          >
            {filterButtons.map((btn) => {
              const isSelected = activeFilter === btn.key;
              return (
                <TouchableOpacity
                  key={btn.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActiveFilter(btn.key)}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {habitsQuery.isLoading ? (
            <>
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
            </>
          ) : habitsQuery.isError && !habitsQuery.data ? (
            <Card>
              <ErrorState
                title="Couldn't load your habits"
                error={habitsQuery.error}
                retrying={habitsQuery.isFetching}
                onRetry={() => void habitsQuery.refetch()}
              />
            </Card>
          ) : filteredHabits.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Layers size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptySubtitle}>{empty.body}</Text>
              {!searchQuery.trim() && ["active", "all", "action", "measurable"].includes(activeFilter) && (
                <Button
                  title="Create a habit"
                  icon={<Plus size={16} color={COLORS.white} />}
                  onPress={() => router.push("/habits/new")}
                />
              )}
            </Card>
          ) : (
            filteredHabits.map((habit) => {
              const streak = habit.stats?.type === "action" ? habit.stats.currentStreak : 0;
              const schedule = formatSchedule(habit);
              const goal = habit.type === "measurable" ? formatGoal(habit, today) : TYPE_LABEL[habit.type];
              return (
                <TouchableOpacity
                  key={habit.id}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${habit.title}. ${goal}. ${schedule}.${
                    habit.type === "action" ? ` ${streak} ${habit.schedule === "weekly" ? "week" : "day"} streak.` : ""
                  }${habit.archived ? " Archived." : ""}`}
                  style={[styles.habitItem, habit.archived && styles.habitItemArchived]}
                  onPress={() => router.push({ pathname: "/habits/[id]", params: { id: habit.id } })}
                >
                  <View style={styles.habitMainRow}>
                    <View style={[styles.colorIndicator, { backgroundColor: habitColor(habit.color) }]} />
                    <View style={styles.habitInfo}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[styles.habitTitle, habit.archived && styles.habitTitleArchived]}
                          numberOfLines={1}
                        >
                          {habit.title}
                        </Text>
                        {habit.archived && (
                          <View style={styles.archivedBadge}>
                            <Archive size={11} color={COLORS.textMuted} />
                            <Text style={styles.archivedText}>Archived</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.habitSub} numberOfLines={2}>
                        {goal} · {schedule}
                      </Text>
                    </View>
                    <View style={styles.habitActionCol}>
                      {habit.type === "action" && <StreakBadge count={streak} size="sm" />}
                      <ChevronRight size={18} color={COLORS.textMuted} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm
  },
  headerCopy: {
    flex: 1
  },
  headerTitle: {
    ...TYPOGRAPHY.title1
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption
  },
  createButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    gap: 4
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs
  },
  searchInput: {
    marginBottom: SPACING.xs
  },
  filterBar: {
    marginVertical: SPACING.xs
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    gap: 8
  },
  filterChip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: COLORS.primaryText,
    fontWeight: "700"
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    marginTop: SPACING.md
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg
  },
  habitItem: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minHeight: 64,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border
  },
  habitItemArchived: {
    opacity: 0.7
  },
  habitMainRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md
  },
  habitInfo: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  habitTitle: {
    ...TYPOGRAPHY.title3,
    flexShrink: 1
  },
  habitTitleArchived: {
    color: COLORS.textSecondary
  },
  archivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BORDER_RADIUS.xs,
    gap: 3
  },
  archivedText: {
    ...TYPOGRAPHY.micro
  },
  habitSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 3
  },
  habitActionCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: SPACING.sm
  }
});
