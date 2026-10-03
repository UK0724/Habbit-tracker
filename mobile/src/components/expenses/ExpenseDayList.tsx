import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
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
    <Pressable
      android_ripple={{ color: "rgba(255, 255, 255, 0.08)" }}
      onPress={() => onPress(expense)}
      onLongPress={() => onLongPress(expense)}
      delayLongPress={400}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${formatRupees(expense.amount)}, ${expense.category}, paid with ${expense.paymentMethod || "UPI"}${showNote ? `, ${note}` : ""}`}
      accessibilityHint="Opens the expense to edit. Long press to delete."
      accessibilityActions={[{ name: "delete", label: "Delete expense" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "delete") onLongPress(expense);
      }}
    >
      <View style={[styles.icon, { backgroundColor: `${meta.color}22` }]}>
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
    </Pressable>
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
        marginBottom: SPACING.xs,
    gap: SPACING.sm
  },
  headerDate: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, flexShrink: 1 },
  headerTotal: { fontSize: 13, fontWeight: "500", color: COLORS.textMuted, fontVariant: ["tabular-nums"] },
  card: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingVertical: SPACING.sm,
    gap: SPACING.lg
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, marginLeft: 0 },
  pressed: { opacity: 0.85 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  emoji: { fontSize: 18 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...TYPOGRAPHY.body, fontSize: 16 },
  subtitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  amount: { ...TYPOGRAPHY.body, fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] }
});
