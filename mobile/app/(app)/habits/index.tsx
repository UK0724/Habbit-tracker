import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search } from "lucide-react-native";
import { COLORS, LIST, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../../src/constants/theme";
import { ProgressHeader } from "../../../src/components/ProgressHeader";
import { Input } from "../../../src/components/Input";
import { Button } from "../../../src/components/Button";
import { Divider, LeadingDot, ListRow, RowSkeleton } from "../../../src/components/List";
import { Fab, FAB_CLEARANCE } from "../../../src/components/Fab";
import { ErrorState } from "../../../src/components/StateViews";
import { habitColor } from "../../../src/utils/habitColor";
import { librarySubtitle } from "../../../src/utils/habitRow";
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

  const openNewHabit = () => router.push("/habits/new");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Habits
          </Text>
          <Text style={styles.headerSubtitle}>
            {habitsQuery.isSuccess ? `${activeCount} active` : " "}
          </Text>
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
                <Pressable
                  key={btn.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setActiveFilter(btn.key)}
                  android_ripple={{ color: COLORS.pressed }}
                  hitSlop={{ top: 4, bottom: 4 }}
                  style={({ pressed }) => [
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                    pressed && Platform.OS !== "android" && styles.filterChipPressed
                  ]}
                >
                  <Text
                    style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                    maxFontSizeMultiplier={1.4}
                  >
                    {btn.label}
                  </Text>
                </Pressable>
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
            <View style={styles.list}>
              <RowSkeleton trailing={false} />
              <Divider />
              <RowSkeleton trailing={false} />
              <Divider />
              <RowSkeleton trailing={false} />
            </View>
          ) : habitsQuery.isError && !habitsQuery.data ? (
            <ErrorState
              title="Couldn't load your habits"
              error={habitsQuery.error}
              retrying={habitsQuery.isFetching}
              onRetry={() => void habitsQuery.refetch()}
            />
          ) : filteredHabits.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptySubtitle}>{empty.body}</Text>
              {!searchQuery.trim() && ["active", "all", "action", "measurable"].includes(activeFilter) && (
                <Button
                  title="Create a habit"
                  icon={<Plus size={16} color={COLORS.white} />}
                  onPress={openNewHabit}
                />
              )}
            </View>
          ) : (
            <View style={styles.list}>
              {filteredHabits.map((habit, index) => {
                const subtitle = librarySubtitle(habit, today).join(" · ");
                return (
                  <React.Fragment key={habit.id}>
                    {index > 0 ? <Divider /> : null}
                    <ListRow
                      title={habit.title}
                      subtitle={subtitle}
                      leading={<LeadingDot color={habitColor(habit.color)} dimmed={habit.archived} />}
                      muted={habit.archived}
                      titleLines={1}
                      titleAccessory={
                        habit.archived ? <Text style={styles.archivedText}>Archived</Text> : null
                      }
                      chevron
                      accessibilityLabel={`${habit.title}. ${subtitle}.${habit.archived ? " Archived." : ""}`}
                      accessibilityHint="Opens habit details"
                      onPress={() => router.push({ pathname: "/habits/[id]", params: { id: habit.id } })}
                    />
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Fab onPress={openNewHabit} accessibilityLabel="New habit" />
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
    paddingHorizontal: LIST.gutter,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm
  },
  headerTitle: {
    ...TYPOGRAPHY.hero
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginTop: 2
  },
  searchContainer: {
    paddingHorizontal: LIST.gutter,
    marginBottom: SPACING.xs
  },
  searchInput: {
    marginBottom: SPACING.xs
  },
  filterBar: {
    marginBottom: SPACING.sm
  },
  filterScroll: {
    paddingHorizontal: LIST.gutter,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs
  },
  // Low emphasis: plain text until selected (filled, no border).
  filterChip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden"
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight
  },
  filterChipPressed: {
    backgroundColor: COLORS.pressed
  },
  filterChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: COLORS.primaryText,
    fontWeight: "700"
  },
  listContent: {
    paddingBottom: FAB_CLEARANCE
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.divider
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: LIST.gutter + SPACING.sm,
    paddingVertical: SPACING.xxxl
  },
  emptyTitle: {
    ...TYPOGRAPHY.title2,
    textAlign: "center"
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg
  },
  archivedText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted
  }
});
