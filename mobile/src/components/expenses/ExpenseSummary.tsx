import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PiggyBank } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../../constants/theme";
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

const RIPPLE = { color: "rgba(255, 255, 255, 0.08)" } as const;

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
    <View style={styles.summary}>
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
    </View>
  );
}

export function CategoryBreakdown({ totals }: { totals: CategoryTotals }) {
  if (!totals.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        By category
      </Text>
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
            <Text style={styles.categoryEmoji} maxFontSizeMultiplier={1.3}>
              {meta.emoji}
            </Text>
            <View style={styles.categoryBody}>
              <View style={styles.rowBetween}>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {item.category}
                </Text>
                <Text style={styles.amount}>{formatRupees(item.total)}</Text>
              </View>
              <View style={styles.thinTrack}>
                <View style={[styles.fill, { width: `${Math.max(2, percent)}%`, backgroundColor: meta.color }]} />
              </View>
              <Text style={styles.percent}>
                {percent}% · {plural(item.count, "expense")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
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
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, styles.cardTitleInline]} accessibilityRole="header">
          Budgets
        </Text>
        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
          android_ripple={RIPPLE}
          hitSlop={4}
          onPress={onEdit}
          disabled={loading || Boolean(error)}
          accessibilityRole="button"
          accessibilityLabel="Set budgets"
        >
          <Text style={styles.linkText}>{budgets.length ? "Edit" : "Set budgets"}</Text>
        </Pressable>
      </View>
      {error ? (
        <ErrorState compact title="Couldn't load budgets" error={error} onRetry={onRetry} retrying={retrying} />
      ) : loading ? null : budgets.length === 0 ? (
        <Pressable
          style={({ pressed }) => [styles.emptyBudget, pressed && styles.pressed]}
          android_ripple={RIPPLE}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="No budgets yet. Set monthly limits per category"
        >
          <PiggyBank size={22} color={COLORS.primaryText} />
          <Text style={styles.emptyBudgetText}>
            Set monthly limits per category to see how close you are.
          </Text>
        </Pressable>
      ) : (
        budgets.map((budget) => {
          const spent = spentByCategory.get(budget.category) ?? 0;
          const status = budgetStatus(spent, budget.monthlyLimit);
          if (!status) return null;
          const meta = categoryMeta(budget.category);
          const color = status.over ? COLORS.danger : status.percent >= 80 ? COLORS.warning : meta.color;
          return (
            <View key={budget.category} style={styles.budgetRow}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { paddingTop: SPACING.sm, paddingBottom: SPACING.lg },
  section: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border
  },
  eyebrow: { ...TYPOGRAPHY.bodySecondary },
  total: { fontSize: 36, fontWeight: "700", color: COLORS.text, marginTop: 2, fontVariant: ["tabular-nums"] },
  meta: { ...TYPOGRAPHY.bodySecondary, marginTop: 2 },
  metaStrong: { ...TYPOGRAPHY.bodySecondary, flexShrink: 1 },
  budgetBlock: { marginTop: SPACING.lg, gap: SPACING.sm },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACING.sm, flexWrap: "wrap" },
  track: {
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    overflow: "hidden"
  },
  thinTrack: {
    height: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    overflow: "hidden",
    marginTop: 6
  },
  fill: { height: "100%", borderRadius: BORDER_RADIUS.full },
  cardTitle: { fontSize: 13, fontWeight: "600", color: COLORS.primaryText, marginBottom: SPACING.xs },
  cardTitleInline: { marginBottom: 0 },
  categoryRow: { flexDirection: "row", alignItems: "center", minHeight: 56, gap: SPACING.md, paddingVertical: SPACING.sm },
  categoryEmoji: { fontSize: 20, width: 28, textAlign: "center" },
  categoryBody: { flex: 1, minWidth: 0 },
  categoryName: { ...TYPOGRAPHY.body, fontSize: 15, flex: 1 },
  percent: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  amount: { ...TYPOGRAPHY.body, fontSize: 15, fontWeight: "600", fontVariant: ["tabular-nums"], textAlign: "right" },
  linkButton: {
    minHeight: TOUCH_TARGET,
    minWidth: TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden"
  },
  linkText: { fontSize: 14, fontWeight: "600", color: COLORS.primaryText },
  pressed: { opacity: 0.85 },
  emptyBudget: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    minHeight: 56,
    paddingVertical: SPACING.sm
  },
  emptyBudgetText: { ...TYPOGRAPHY.bodySecondary, flex: 1 },
  budgetRow: { paddingVertical: SPACING.sm, gap: 6 },
  budgetAmounts: { ...TYPOGRAPHY.bodySecondary, fontVariant: ["tabular-nums"] },
  budgetNote: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary }
});
