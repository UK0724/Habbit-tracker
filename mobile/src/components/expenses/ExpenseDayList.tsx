import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../../constants/theme";
import {
  categoryMeta,
  dayLabel,
  formatRupees,
  type Expense,
  type groupByDay
} from "../../services/expenses";

type DayGroups = ReturnType<typeof groupByDay>;

function ExpenseRow({
  expense,
  onPress,
  onLongPress,
  last
}: {
  expense: Expense;
  onPress: (expense: Expense) => void;
  onLongPress: (expense: Expense) => void;
  last: boolean;
}) {
  const meta = categoryMeta(expense.category);
  const note = expense.description?.trim();
  const showNote = Boolean(note) && note !== expense.category;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(expense)}
      onLongPress={() => onLongPress(expense)}
      delayLongPress={400}
      style={[styles.row, !last && styles.rowDivider]}
      accessibilityRole="button"
      accessibilityLabel={`${formatRupees(expense.amount)}, ${expense.category}, paid with ${expense.paymentMethod || "UPI"}${showNote ? `, ${note}` : ""}`}
      accessibilityHint="Opens the expense to edit. Long press to delete."
      accessibilityActions={[{ name: "delete", label: "Delete expense" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "delete") onLongPress(expense);
      }}
    >
      <View style={[styles.icon, { backgroundColor: `${meta.color}26`, borderColor: `${meta.color}55` }]}>
        <Text style={styles.emoji} maxFontSizeMultiplier={1.3}>
          {meta.emoji}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {showNote ? note : expense.category}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {showNote ? `${expense.category} · ` : ""}
          {expense.paymentMethod || "UPI"}
        </Text>
      </View>
      <Text style={styles.amount} maxFontSizeMultiplier={1.5}>
        {formatRupees(expense.amount)}
      </Text>
    </TouchableOpacity>
  );
}

export function ExpenseDayList({
  groups,
  today,
  onPressExpense,
  onLongPressExpense
}: {
  groups: DayGroups;
  today: string;
  onPressExpense: (expense: Expense) => void;
  onLongPressExpense: (expense: Expense) => void;
}) {
  return (
    <View>
      {groups.map((group) => (
        <View key={group.date} style={styles.group}>
          <View style={styles.header} accessibilityRole="header">
            <Text style={styles.headerDate}>{dayLabel(group.date, today)}</Text>
            <Text style={styles.headerTotal}>{formatRupees(group.total)}</Text>
          </View>
          <View style={styles.card}>
            {group.items.map((expense, index) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onPress={onPressExpense}
                onLongPress={onLongPressExpense}
                last={index === group.items.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: SPACING.md },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
    gap: SPACING.sm
  },
  headerDate: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, flexShrink: 1 },
  headerTotal: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, fontVariant: ["tabular-nums"] },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.md
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  emoji: { fontSize: 18 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...TYPOGRAPHY.body, fontWeight: "600" },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  amount: { ...TYPOGRAPHY.title3, fontVariant: ["tabular-nums"] }
});
