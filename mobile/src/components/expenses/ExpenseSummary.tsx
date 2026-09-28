import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PiggyBank } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../../constants/theme";
import { Card } from "../Card";
import { ErrorState } from "../StateViews";
import {
  budgetStatus,
  categoryMeta,
  formatRupees,
  type Budget,
  type totalsByCategory
} from "../../services/expenses";
import { plural } from "../../utils/format";

type CategoryTotals = ReturnType<typeof totalsByCategory>;

function ProgressBar({
  ratio,
  color,
  label,
  percent
}: {
  ratio: number;
  color: string;
  label: string;
  percent: number;
}) {
  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.min(100, Math.max(0, percent)) }}
    >
      {ratio > 0 ? (
        <View style={[styles.fill, { width: `${Math.max(2, ratio * 100)}%`, backgroundColor: color }]} />
      ) : null}
    </View>
  );
}

export function MonthSummaryCard({
  monthName,
  total,
  count,
  budgetTotal,
  dailyAverage
}: {
  monthName: string;
  total: number;
  count: number;
  budgetTotal: number;
  dailyAverage: number;
}) {
  const status = budgetStatus(total, budgetTotal);
  const barColor = status?.over ? COLORS.danger : status && status.percent >= 80 ? COLORS.warning : COLORS.success;
  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>Spent in {monthName}</Text>
      <Text
        style={styles.total}
        maxFontSizeMultiplier={1.4}
        numberOfLines={1}
        adjustsFontSizeToFit
        accessibilityLabel={`${formatRupees(total)} spent in ${monthName}`}
      >
        {formatRupees(total)}
      </Text>
      <Text style={styles.meta}>
        {plural(count, "expense")}
        {count > 0 ? ` · ${formatRupees(Math.round(dailyAverage))}/day avg` : ""}
      </Text>
      {status ? (
        <View style={styles.budgetBlock}>
          <View style={styles.rowBetween}>
            <Text style={styles.metaStrong}>
              {status.percent}% of {formatRupees(budgetTotal)} budget
            </Text>
            <Text style={[styles.metaStrong, { color: status.over ? COLORS.dangerText : COLORS.success }]}>
              {status.over ? `${formatRupees(-status.remaining)} over` : `${formatRupees(status.remaining)} left`}
            </Text>
          </View>
          <ProgressBar
            ratio={status.ratio}
            percent={status.percent}
            color={barColor}
            label={`${status.percent} percent of total budget used`}
          />
        </View>
      ) : null}
    </Card>
  );
}

export function CategoryBreakdown({ totals }: { totals: CategoryTotals }) {
  if (!totals.length) return null;
  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        By category
      </Text>
      {/* Stacked share bar */}
      <View style={styles.stack} accessible={false} importantForAccessibility="no-hide-descendants">
        {totals.map((item) => (
          <View
            key={item.category}
            style={{ flex: Math.max(item.share, 0.001), backgroundColor: categoryMeta(item.category).color }}
          />
        ))}
      </View>
      {totals.map((item) => {
        const meta = categoryMeta(item.category);
        const percent = Math.round(item.share * 100);
        return (
          <View
            key={item.category}
            style={styles.categoryRow}
            accessible
            accessibilityLabel={`${item.category}: ${formatRupees(item.total)}, ${percent} percent, ${plural(item.count, "expense")}`}
          >
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <Text style={styles.categoryName} numberOfLines={1}>
              {meta.emoji} {item.category}
            </Text>
            <Text style={styles.percent}>{percent}%</Text>
            <Text style={styles.amount}>{formatRupees(item.total)}</Text>
          </View>
        );
      })}
    </Card>
  );
}

export function BudgetProgressCard({
  budgets,
  spentByCategory,
  onEdit,
  loading,
  error,
  onRetry,
  retrying
}: {
  budgets: Budget[];
  spentByCategory: Map<string, number>;
  onEdit: () => void;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          Budgets
        </Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={onEdit}
          disabled={loading || Boolean(error)}
          accessibilityRole="button"
          accessibilityLabel="Set budgets"
        >
          <Text style={styles.linkText}>{budgets.length ? "Edit" : "Set budgets"}</Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <ErrorState compact title="Couldn't load budgets" error={error} onRetry={onRetry} retrying={retrying} />
      ) : loading ? null : budgets.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyBudget}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="No budgets yet. Set monthly limits per category"
        >
          <PiggyBank size={22} color={COLORS.primaryText} />
          <Text style={styles.emptyBudgetText}>
            Set monthly limits per category to see how close you are.
          </Text>
        </TouchableOpacity>
      ) : (
        budgets.map((budget) => {
          const spent = spentByCategory.get(budget.category) ?? 0;
          const status = budgetStatus(spent, budget.monthlyLimit);
          if (!status) return null;
          const meta = categoryMeta(budget.category);
          const color = status.over ? COLORS.danger : status.percent >= 80 ? COLORS.warning : meta.color;
          return (
            <View key={budget.category} style={[styles.budgetRow, status.over && styles.budgetRowOver]}>
              <View style={styles.rowBetween}>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {meta.emoji} {budget.category}
                </Text>
                <Text style={styles.budgetAmounts}>
                  {formatRupees(spent)} / {formatRupees(budget.monthlyLimit)}
                </Text>
              </View>
              <ProgressBar
                ratio={status.ratio}
                percent={status.percent}
                color={color}
                label={`${budget.category} budget: ${status.percent} percent used${status.over ? ", over budget" : ""}`}
              />
              <Text style={[styles.budgetNote, status.over && { color: COLORS.dangerText, fontWeight: "700" }]}>
                {status.over
                  ? `Over budget by ${formatRupees(-status.remaining)}`
                  : `${formatRupees(status.remaining)} left · ${status.percent}%`}
              </Text>
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  eyebrow: { ...TYPOGRAPHY.label, textTransform: "uppercase", letterSpacing: 0.5 },
  total: { fontSize: 34, fontWeight: "800", color: COLORS.text, marginTop: SPACING.xs, fontVariant: ["tabular-nums"] },
  meta: { ...TYPOGRAPHY.bodySecondary, marginTop: 2 },
  metaStrong: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: "700", flexShrink: 1 },
  budgetBlock: { marginTop: SPACING.md, gap: SPACING.sm },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.sm, flexWrap: "wrap" },
  track: {
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    overflow: "hidden"
  },
  fill: { height: "100%", borderRadius: BORDER_RADIUS.full },
  cardTitle: { ...TYPOGRAPHY.title3 },
  stack: {
    flexDirection: "row",
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 2
  },
  categoryRow: { flexDirection: "row", alignItems: "center", minHeight: TOUCH_TARGET - 8, gap: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { ...TYPOGRAPHY.body, flex: 1, fontWeight: "600" },
  percent: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, minWidth: 36, textAlign: "right" },
  amount: { ...TYPOGRAPHY.body, fontWeight: "700", fontVariant: ["tabular-nums"], textAlign: "right" },
  linkButton: { minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET, justifyContent: "center", alignItems: "flex-end" },
  linkText: { fontSize: 14, fontWeight: "700", color: COLORS.primaryText },
  emptyBudget: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    minHeight: TOUCH_TARGET,
    paddingVertical: SPACING.sm
  },
  emptyBudgetText: { ...TYPOGRAPHY.bodySecondary, flex: 1 },
  budgetRow: { marginTop: SPACING.md, gap: 6 },
  budgetRowOver: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm
  },
  budgetAmounts: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontVariant: ["tabular-nums"] },
  budgetNote: { ...TYPOGRAPHY.caption }
});
