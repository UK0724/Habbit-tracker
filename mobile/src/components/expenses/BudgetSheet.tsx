import React, { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../../constants/theme";
import { Button } from "../Button";
import { Input } from "../Input";
import { errorMessage } from "../../services/api";
import {
  EXPENSE_CATEGORIES,
  amountInputText,
  categoryMeta,
  parseBudget,
  roundMoney,
  type Budget
} from "../../services/expenses";
import { hapticError, hapticSuccess } from "../../utils/haptics";
import { ExpenseBottomSheet } from "./ExpenseBottomSheet";
import { useSetBudgets } from "./useExpenses";

const limitOf = (budgets: Budget[], category: string) =>
  Number(budgets.find((budget) => budget.category === category)?.monthlyLimit) || 0;

/** Per-category monthly limits; blank or 0 clears a budget. */
export function BudgetSheet({
  visible,
  budgets,
  onClose
}: {
  visible: boolean;
  budgets: Budget[];
  onClose: () => void;
}) {
  const saveBudgets = useSetBudgets();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Categories with a budget the app no longer lists still show up here.
  const categories: string[] = [...EXPENSE_CATEGORIES];
  for (const budget of budgets)
    if (!categories.includes(budget.category) && budget.monthlyLimit > 0) categories.push(budget.category);

  useEffect(() => {
    if (!visible) return;
    const initial: Record<string, string> = {};
    for (const category of categories) {
      const limit = limitOf(budgets, category);
      initial[category] = limit > 0 ? amountInputText(limit) : "";
    }
    setValues(initial);
    setErrors({});
    setFormError(null);
    saveBudgets.reset();
    // Only reset on open; refetches while editing must not wipe typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSave = () => {
    if (saveBudgets.isPending) return;
    const nextErrors: Record<string, string> = {};
    const changes: { category: string; monthlyLimit: number }[] = [];
    for (const category of categories) {
      const parsed = parseBudget(values[category] ?? "");
      if (parsed.error !== null) {
        nextErrors[category] = parsed.error;
        continue;
      }
      const limit = roundMoney(parsed.value);
      if (limit !== limitOf(budgets, category)) changes.push({ category, monthlyLimit: limit });
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      void hapticError();
      AccessibilityInfo.announceForAccessibility("Check the highlighted budgets.");
      return;
    }
    if (!changes.length) {
      onClose();
      return;
    }
    setFormError(null);
    saveBudgets.mutate(changes, {
      onSuccess: () => {
        void hapticSuccess();
        onClose();
      },
      onError: (error) => {
        const failed = (error as { failed?: string[] }).failed ?? [];
        const message = `${errorMessage(error, "Could not save budgets.")}${
          failed.length && failed.length < changes.length ? ` Not saved: ${failed.join(", ")}.` : ""
        }`;
        setFormError(message);
        void hapticError();
        AccessibilityInfo.announceForAccessibility(message);
      }
    });
  };

  const busy = saveBudgets.isPending;

  return (
    <ExpenseBottomSheet
      visible={visible}
      title="Monthly budgets"
      onClose={onClose}
      closeDisabled={busy}
      footer={
        <>
          {formError ? (
            <Text style={styles.formError} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {formError}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={busy} style={styles.action} />
            <Button title="Save budgets" onPress={handleSave} loading={busy} style={styles.action} />
          </View>
        </>
      }
    >
      <Text style={styles.intro}>
        Set a monthly limit per category. Leave blank to have no budget. Limits apply to every month.
      </Text>
      {categories.map((category) => {
        const meta = categoryMeta(category);
        const value = values[category] ?? "";
        return (
          <View key={category} style={styles.row}>
            <Input
              label={`${meta.emoji} ${category}`}
              accessibilityLabel={`${category} monthly budget in rupees`}
              value={value}
              onChangeText={(text) => {
                setValues((current) => ({ ...current, [category]: text }));
                if (errors[category])
                  setErrors((current) => {
                    const next = { ...current };
                    delete next[category];
                    return next;
                  });
              }}
              placeholder="No budget"
              keyboardType="decimal-pad"
              inputMode="decimal"
              editable={!busy}
              maxLength={16}
              error={errors[category]}
              leftIcon={<Text style={styles.rupee}>₹</Text>}
              rightIcon={
                value ? (
                  <TouchableOpacity
                    style={styles.clear}
                    disabled={busy}
                    onPress={() => setValues((current) => ({ ...current, [category]: "" }))}
                    accessibilityRole="button"
                    accessibilityLabel={`Clear ${category} budget`}
                  >
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                ) : undefined
              }
              containerStyle={styles.inputContainer}
            />
          </View>
        );
      })}
    </ExpenseBottomSheet>
  );
}

const styles = StyleSheet.create({
  intro: { ...TYPOGRAPHY.bodySecondary, marginBottom: SPACING.md },
  row: { marginBottom: SPACING.xs },
  inputContainer: { marginBottom: SPACING.sm },
  rupee: { fontSize: 16, fontWeight: "700", color: COLORS.textSecondary },
  clear: {
    minWidth: TOUCH_TARGET,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -SPACING.sm
  },
  clearText: { fontSize: 13, fontWeight: "700", color: COLORS.dangerText },
  formError: { ...TYPOGRAPHY.body, color: COLORS.dangerText },
  actions: { flexDirection: "row", gap: SPACING.md },
  action: { flex: 1 }
});
