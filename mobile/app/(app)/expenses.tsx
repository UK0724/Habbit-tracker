import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Plus, Receipt } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../../src/constants/theme";
import { ProgressHeader } from "../../src/components/ProgressHeader";
import { CardSkeleton, ErrorState } from "../../src/components/StateViews";
import { errorMessage } from "../../src/services/api";
import {
  activeBudgets,
  defaultExpenseDate,
  expensesInMonth,
  groupByDay,
  monthLabel,
  monthOf,
  monthRange,
  shiftMonth,
  sumAmounts,
  totalsByCategory,
  type Expense
} from "../../src/services/expenses";
import { useLocalDate } from "../../src/utils/date";
import { hapticSuccess } from "../../src/utils/haptics";
import {
  useBudgets,
  useDeleteExpense,
  useExpenseList
} from "../../src/components/expenses/useExpenses";
import {
  BudgetProgressCard,
  CategoryBreakdown,
  MonthSummaryCard
} from "../../src/components/expenses/ExpenseSummary";
import { ExpenseDayList } from "../../src/components/expenses/ExpenseDayList";
import { ExpenseSheet } from "../../src/components/expenses/ExpenseSheet";
import { BudgetSheet } from "../../src/components/expenses/BudgetSheet";
import { confirmDeleteExpense } from "../../src/components/expenses/confirmDeleteExpense";

type SheetState = { open: false } | { open: true; expense: Expense | null };

export default function ExpensesScreen() {
  const today = useLocalDate();
  const currentMonth = monthOf(today);
  const currentYear = Number(today.slice(0, 4));
  const [month, setMonth] = useState(currentMonth);
  const [sheet, setSheet] = useState<SheetState>({ open: false });
  // Kept while the sheet slides out so its contents don't flash to "Add".
  const [sheetExpense, setSheetExpense] = useState<Expense | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const expensesQuery = useExpenseList();
  const budgetsQuery = useBudgets();
  const deleteExpense = useDeleteExpense();

  // Never sit on a future month (e.g. after the device clock moves back).
  useEffect(() => {
    if (month > currentMonth) setMonth(currentMonth);
  }, [month, currentMonth]);

  const monthExpenses = useMemo(
    () => expensesInMonth(expensesQuery.data ?? [], month),
    [expensesQuery.data, month]
  );
  const groups = useMemo(() => groupByDay(monthExpenses), [monthExpenses]);
  const categoryTotals = useMemo(() => totalsByCategory(monthExpenses), [monthExpenses]);
  const spentByCategory = useMemo(
    () => new Map(categoryTotals.map((item) => [item.category, item.total])),
    [categoryTotals]
  );
  const budgets = useMemo(() => activeBudgets(budgetsQuery.data ?? []), [budgetsQuery.data]);
  const budgetTotal = useMemo(() => sumAmounts(budgets.map((b) => ({ amount: b.monthlyLimit }))), [budgets]);
  const total = useMemo(() => sumAmounts(monthExpenses), [monthExpenses]);
  const daysElapsed = month === currentMonth ? Number(today.slice(8, 10)) : monthRange(month).days;

  const monthName = monthLabel(month, currentYear);
  const canGoNext = month < currentMonth;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([expensesQuery.refetch(), budgetsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [expensesQuery, budgetsQuery]);

  const openAdd = () => {
    setSheetExpense(null);
    setSheet({ open: true, expense: null });
  };
  const openEdit = (expense: Expense) => {
    setSheetExpense(expense);
    setSheet({ open: true, expense });
  };
  const askDelete = (expense: Expense) =>
    confirmDeleteExpense(expense, () =>
      deleteExpense.mutate(expense.id, {
        onSuccess: () => void hapticSuccess(),
        onError: (error) =>
          Alert.alert("Couldn't delete", errorMessage(error, "Please try again."))
      })
    );

  const initialLoading = expensesQuery.isPending;
  const loadError = expensesQuery.isError && !expensesQuery.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ProgressHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            Expenses
          </Text>
        </View>

        <View style={styles.monthSwitcher}>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => setMonth((value) => shiftMonth(value, -1))}
            accessibilityRole="button"
            accessibilityLabel={`Previous month, ${monthLabel(shiftMonth(month, -1), currentYear)}`}
          >
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.monthLabelButton}
            disabled={month === currentMonth}
            onPress={() => setMonth(currentMonth)}
            accessibilityRole={month === currentMonth ? "text" : "button"}
            accessibilityLabel={month === currentMonth ? `${monthName}, this month` : `${monthName}. Go to this month`}
          >
            <Text style={styles.monthLabel} numberOfLines={1} maxFontSizeMultiplier={1.5}>
              {monthLabel(month)}
            </Text>
            {month !== currentMonth ? (
              <Text style={styles.monthHint} maxFontSizeMultiplier={1.5}>
                Tap for this month
              </Text>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.monthArrow, !canGoNext && styles.monthArrowDisabled]}
            disabled={!canGoNext}
            onPress={() => setMonth((value) => (value < currentMonth ? shiftMonth(value, 1) : value))}
            accessibilityRole="button"
            accessibilityLabel={canGoNext ? `Next month, ${monthLabel(shiftMonth(month, 1), currentYear)}` : "Next month"}
            accessibilityState={{ disabled: !canGoNext }}
          >
            <ChevronRight size={24} color={canGoNext ? COLORS.text : COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {initialLoading ? (
          <View accessibilityLabel="Loading expenses">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={3} />
            <CardSkeleton lines={1} />
          </View>
        ) : loadError ? (
          <ErrorState
            title="Couldn't load expenses"
            error={expensesQuery.error}
            onRetry={() => void expensesQuery.refetch()}
            retrying={expensesQuery.isFetching}
          />
        ) : (
          <>
            <MonthSummaryCard
              monthName={monthName}
              total={total}
              count={monthExpenses.length}
              budgetTotal={budgetTotal}
              dailyAverage={total / Math.max(1, daysElapsed)}
            />
            <CategoryBreakdown totals={categoryTotals} />
            <BudgetProgressCard
              budgets={budgets}
              spentByCategory={spentByCategory}
              onEdit={() => setBudgetOpen(true)}
              loading={budgetsQuery.isPending}
              error={budgetsQuery.isError && !budgetsQuery.data ? budgetsQuery.error : null}
              onRetry={() => void budgetsQuery.refetch()}
              retrying={budgetsQuery.isFetching}
            />

            {groups.length === 0 ? (
              <View style={styles.empty}>
                <Receipt size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No expenses in {monthName} yet — tap + to add one</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle} accessibilityRole="header">
                  Transactions
                </Text>
                <ExpenseDayList
                  groups={groups}
                  today={today}
                  onPressExpense={openEdit}
                  onLongPressExpense={askDelete}
                />
                <Text style={styles.tip}>Tap to edit · long-press to delete</Text>
              </>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Plus size={28} color={COLORS.white} strokeWidth={2.5} />
      </TouchableOpacity>

      <ExpenseSheet
        visible={sheet.open}
        expense={sheet.open ? sheet.expense : sheetExpense}
        initialDate={defaultExpenseDate(month, today)}
        today={today}
        onClose={() => setSheet({ open: false })}
        onSaved={(_saved, date) => {
          const savedMonth = monthOf(date);
          if (savedMonth !== month && savedMonth <= currentMonth) setMonth(savedMonth);
        }}
      />
      <BudgetSheet
        visible={budgetOpen}
        budgets={budgetsQuery.data ?? []}
        onClose={() => setBudgetOpen(false)}
      />
    </SafeAreaView>
  );
}

const FAB_SIZE = 56;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: FAB_SIZE + SPACING.xxxl + SPACING.lg
  },
  titleRow: { marginBottom: SPACING.sm },
  title: { ...TYPOGRAPHY.hero },
  monthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs
  },
  monthArrow: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center"
  },
  monthArrowDisabled: { opacity: 0.5 },
  monthLabelButton: {
    flex: 1,
    minHeight: TOUCH_TARGET + 4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs
  },
  monthLabel: { ...TYPOGRAPHY.title3 },
  monthHint: { ...TYPOGRAPHY.micro, color: COLORS.primaryText, marginTop: 2 },
  sectionTitle: { ...TYPOGRAPHY.title3, marginTop: SPACING.sm, marginBottom: SPACING.md },
  empty: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md
  },
  emptyTitle: { ...TYPOGRAPHY.bodySecondary, textAlign: "center", fontSize: 15 },
  tip: { ...TYPOGRAPHY.caption, textAlign: "center", marginTop: SPACING.xs },
  fab: {
    position: "absolute",
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  }
});
