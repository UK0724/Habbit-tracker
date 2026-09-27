import { ProgressHeader } from "../../../src/components/ProgressHeader";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Search,
  ChevronRight,
  Layers,
  Archive
} from "lucide-react-native";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS
} from "../../../src/constants/theme";
import { Input } from "../../../src/components/Input";
import { StreakBadge } from "../../../src/components/StreakBadge";
import { Card } from "../../../src/components/Card";
import { habitApi } from "../../../src/services/api";
import { habitColor } from "../../../src/utils/habitColor";
import type { HabitListItem } from "@habit-tracker/shared";

type FilterType = "all" | "active" | "action" | "measurable" | "archived";

export default function HabitsListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: habits = [],
    isLoading,
    refetch
  } = useQuery<HabitListItem[]>({
    queryKey: ["habits", "all"],
    queryFn: () => habitApi.list({ includeArchived: true })
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = habit.title.toLowerCase().includes(query);
        const matchesDesc = habit.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Filter tabs
      switch (activeFilter) {
        case "active":
          return !habit.archived;
        case "archived":
          return habit.archived;
        case "action":
          return !habit.archived && habit.type === "action";
        case "measurable":
          return !habit.archived && habit.type === "measurable";
        case "all":
        default:
          return true;
      }
    });
  }, [habits, searchQuery, activeFilter]);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "all", label: "All" },
    { key: "action", label: "Action" },
    { key: "measurable", label: "Measurable" },
    { key: "archived", label: "Archived" }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Habit Armory</Text>
            <Text style={styles.headerSubtitle}>
              {habits.filter((h) => !h.archived).length} active disciplines
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={() => router.push("/habits/new")}
          >
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search habits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={18} color={COLORS.textMuted} />}
            containerStyle={styles.searchInput}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filterButtons.map((btn) => {
              const isSelected = activeFilter === btn.key;
              return (
                <TouchableOpacity
                  key={btn.key}
                  onPress={() => setActiveFilter(btn.key)}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive
                    ]}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Habit List */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredHabits.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Layers size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Habits Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Try searching with a different term"
                  : "Create your first habit to begin leveling up"}
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => router.push("/habits/new")}
              >
                <Plus size={16} color={COLORS.white} />
                <Text style={styles.emptyCreateButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            filteredHabits.map((habit) => {
              const streak =
                habit.stats?.type === "action" ? habit.stats.currentStreak : 0;

              return (
                <TouchableOpacity
                  key={habit.id}
                  activeOpacity={0.8}
                  style={[
                    styles.habitItem,
                    habit.archived && styles.habitItemArchived
                  ]}
                  onPress={() => router.push(`/habits/${habit.id}`)}
                >
                  <View style={styles.habitMainRow}>
                    <View
                      style={[
                        styles.colorIndicator,
                        { backgroundColor: habitColor(habit.color) }
                      ]}
                    />

                    <View style={styles.habitInfo}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.habitTitle,
                            habit.archived && styles.habitTitleArchived
                          ]}
                          numberOfLines={1}
                        >
                          {habit.title}
                        </Text>
                        {habit.archived && (
                          <View style={styles.archivedBadge}>
                            <Archive size={10} color={COLORS.textMuted} />
                            <Text style={styles.archivedText}>Archived</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.habitSubRow}>
                        <Text style={styles.habitType}>
                          {habit.type === "action"
                            ? "Action Habit"
                            : `Target: ${habit.target ?? ""} ${habit.unit || ""}`}
                        </Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.habitSchedule}>
                          {habit.schedule || "Daily"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.habitActionCol}>
                      <StreakBadge count={streak} size="sm" />
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
    paddingBottom: SPACING.sm
  },
  headerTitle: {
    ...TYPOGRAPHY.title1
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.md,
    gap: 4
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 13
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm
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
    paddingVertical: 6,
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
    color: COLORS.primary,
    fontWeight: "700"
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm
  },
  loaderContainer: {
    paddingVertical: SPACING.xxxl,
    alignItems: "center"
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
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: 6
  },
  emptyCreateButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14
  },
  habitItem: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  habitItemArchived: {
    opacity: 0.6
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
    color: COLORS.text
  },
  habitTitleArchived: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted
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
    fontSize: 10,
    color: COLORS.textMuted
  },
  habitSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3
  },
  habitType: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: COLORS.textMuted
  },
  habitSchedule: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted
  },
  habitActionCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: SPACING.sm
  }
});
