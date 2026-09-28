import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { CalendarDays, Trash2 } from "lucide-react-native";
import { BORDER_RADIUS, COLORS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from "../../constants/theme";
import { Button } from "../Button";
import { Input } from "../Input";
import { errorMessage } from "../../services/api";
import {
  EXPENSE_CATEGORIES,
  NOTE_MAX_LENGTH,
  PAYMENT_METHODS,
  amountInputText,
  categoryMeta,
  dayLabel,
  parseAmount,
  type Expense,
  type SavedExpense
} from "../../services/expenses";
import { localDateString } from "../../utils/date";
import { hapticError, hapticSuccess } from "../../utils/haptics";
import { ExpenseBottomSheet } from "./ExpenseBottomSheet";
import { ChoiceChip } from "./ChoiceChip";
import { confirmDeleteExpense } from "./confirmDeleteExpense";
import { useDeleteExpense, useSaveExpense } from "./useExpenses";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

const toDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};

const yesterdayOf = (today: string) => {
  const date = toDate(today);
  date.setDate(date.getDate() - 1);
  return localDateString(date);
};

export function ExpenseSheet({
  visible,
  expense,
  initialDate,
  today,
  onClose,
  onSaved
}: {
  visible: boolean;
  /** null adds a new expense. */
  expense: Expense | null;
  initialDate: string;
  today: string;
  onClose: () => void;
  onSaved?: (saved: SavedExpense | null, date: string) => void;
}) {
  const save = useSaveExpense();
  const remove = useDeleteExpense();
  const busy = save.isPending || remove.isPending;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [date, setDate] = useState(initialDate);
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [showIosPicker, setShowIosPicker] = useState(false);
  const amountRef = useRef<TextInput>(null);

  // Fresh form every time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    setAmount(expense ? amountInputText(expense.amount) : "");
    setCategory(expense?.category || EXPENSE_CATEGORIES[0]);
    setMethod(expense?.paymentMethod || PAYMENT_METHODS[0]);
    setDate(expense?.date ?? (initialDate > today ? today : initialDate));
    setNote(expense?.description ?? "");
    setAmountError(undefined);
    setFormError(null);
    setShowIosPicker(false);
    save.reset();
    remove.reset();
    // Focusing right after the slide-in animation avoids a keyboard flicker.
    const timer = expense ? null : setTimeout(() => amountRef.current?.focus(), 350);
    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, expense?.id]);

  const categories: string[] = [...EXPENSE_CATEGORIES];
  if (expense && !categories.includes(expense.category)) categories.push(expense.category);
  const methods: string[] = [...PAYMENT_METHODS];
  if (expense?.paymentMethod && !methods.includes(expense.paymentMethod)) methods.push(expense.paymentMethod);

  const yesterday = yesterdayOf(today);
  const customDate = date !== today && date !== yesterday;

  const openDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: toDate(date),
        mode: "date",
        maximumDate: toDate(today),
        onChange: (event, selected) => {
          if (event.type !== "set" || !selected) return;
          const picked = localDateString(selected);
          setDate(picked > today ? today : picked);
        }
      });
    } else {
      setShowIosPicker((shown) => !shown);
    }
  };

  const fail = (message: string) => {
    setFormError(message);
    void hapticError();
    AccessibilityInfo.announceForAccessibility(message);
  };

  const handleSave = () => {
    if (busy) return;
    const parsed = parseAmount(amount);
    if (parsed.error !== null) {
      setAmountError(parsed.error);
      void hapticError();
      AccessibilityInfo.announceForAccessibility(parsed.error);
      return;
    }
    setAmountError(undefined);
    if (date > today) return fail("The date can't be in the future.");
    setFormError(null);
    const input = {
      amount: parsed.value,
      category,
      date,
      description: note.trim().slice(0, NOTE_MAX_LENGTH),
      paymentMethod: method
    };
    save.mutate(
      { id: expense?.id, input },
      {
        onSuccess: (saved) => {
          void hapticSuccess();
          onSaved?.(saved ?? null, input.date);
          onClose();
        },
        onError: (error) => fail(errorMessage(error, "Could not save. Please try again."))
      }
    );
  };

  const handleDelete = () => {
    if (!expense || busy) return;
    confirmDeleteExpense(expense, () =>
      remove.mutate(expense.id, {
        onSuccess: () => {
          void hapticSuccess();
          onClose();
        },
        onError: (error) => fail(errorMessage(error, "Could not delete. Please try again."))
      })
    );
  };

  return (
    <ExpenseBottomSheet
      visible={visible}
      title={expense ? "Edit expense" : "Add expense"}
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
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              disabled={busy}
              style={styles.action}
            />
            <Button
              title={expense ? "Save changes" : "Add expense"}
              onPress={handleSave}
              loading={save.isPending}
              disabled={remove.isPending}
              style={styles.action}
            />
          </View>
          {expense ? (
            <Button
              title="Delete expense"
              variant="ghost"
              textStyle={styles.deleteText}
              icon={<Trash2 size={18} color={COLORS.dangerText} />}
              onPress={handleDelete}
              loading={remove.isPending}
              disabled={save.isPending}
            />
          ) : null}
        </>
      }
    >
      <Input
        ref={amountRef}
        label="Amount (₹)"
        value={amount}
        onChangeText={(text) => {
          setAmount(text);
          if (amountError) setAmountError(undefined);
        }}
        placeholder="0"
        keyboardType="decimal-pad"
        inputMode="decimal"
        returnKeyType="done"
        error={amountError}
        editable={!busy}
        maxLength={16}
        leftIcon={<Text style={styles.rupee}>₹</Text>}
        style={styles.amountInput}
        accessibilityLabel="Amount in rupees"
      />
      <View style={styles.chipRow}>
        {QUICK_AMOUNTS.map((value) => (
          <ChoiceChip
            key={value}
            label={`+₹${value}`}
            selected={false}
            role="button"
            disabled={busy}
            accessibilityLabel={`Add ${value} rupees`}
            onPress={() => {
              const current = parseAmount(amount).value ?? 0;
              setAmount(amountInputText(current + value));
              setAmountError(undefined);
            }}
          />
        ))}
      </View>

      <Text style={styles.label} accessibilityRole="header">
        Category
      </Text>
      <View style={styles.chipRow} accessibilityRole="radiogroup">
        {categories.map((name) => (
          <ChoiceChip
            key={name}
            label={`${categoryMeta(name).emoji} ${name}`}
            accessibilityLabel={name}
            selected={category === name}
            disabled={busy}
            onPress={() => setCategory(name)}
          />
        ))}
      </View>

      <Text style={styles.label} accessibilityRole="header">
        Paid with
      </Text>
      <View style={styles.chipRow} accessibilityRole="radiogroup">
        {methods.map((name) => (
          <ChoiceChip
            key={name}
            label={name}
            selected={method === name}
            disabled={busy}
            onPress={() => setMethod(name)}
          />
        ))}
      </View>

      <Text style={styles.label} accessibilityRole="header">
        Date
      </Text>
      <View style={styles.chipRow} accessibilityRole="radiogroup">
        <ChoiceChip label="Today" selected={date === today} disabled={busy} onPress={() => setDate(today)} />
        <ChoiceChip
          label="Yesterday"
          selected={date === yesterday}
          disabled={busy}
          onPress={() => setDate(yesterday)}
        />
        <TouchableOpacity
          style={[styles.dateButton, customDate && styles.dateButtonActive]}
          onPress={openDatePicker}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={customDate ? `Date: ${dayLabel(date, today)}. Change date` : "Pick another date"}
        >
          <CalendarDays size={18} color={customDate ? COLORS.text : COLORS.textSecondary} />
          <Text
            maxFontSizeMultiplier={1.5}
            style={[styles.dateButtonText, customDate && styles.dateButtonTextActive]}
          >
            {customDate ? dayLabel(date, today) : "Pick date"}
          </Text>
        </TouchableOpacity>
      </View>
      {Platform.OS === "ios" && showIosPicker ? (
        <DateTimePicker
          value={toDate(date)}
          mode="date"
          display="inline"
          maximumDate={toDate(today)}
          themeVariant="dark"
          onChange={(event, selected) => {
            if (event.type !== "set" || !selected) return;
            const picked = localDateString(selected);
            setDate(picked > today ? today : picked);
          }}
        />
      ) : null}

      <Input
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="What was it for?"
        maxLength={NOTE_MAX_LENGTH}
        editable={!busy}
        multiline
        helperText={note.length > NOTE_MAX_LENGTH - 40 ? `${note.length}/${NOTE_MAX_LENGTH}` : undefined}
        containerStyle={styles.noteContainer}
        style={styles.noteInput}
      />
    </ExpenseBottomSheet>
  );
}

const styles = StyleSheet.create({
  rupee: { fontSize: 20, fontWeight: "700", color: COLORS.textSecondary },
  amountInput: { fontSize: 22, fontWeight: "700" },
  label: { ...TYPOGRAPHY.label, marginTop: SPACING.md, marginBottom: SPACING.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  dateButton: {
    minHeight: TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface
  },
  dateButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  dateButtonText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  dateButtonTextActive: { color: COLORS.text },
  noteContainer: { marginTop: SPACING.lg },
  noteInput: { minHeight: 48, maxHeight: 120, textAlignVertical: "top", paddingTop: 12 },
  formError: { ...TYPOGRAPHY.body, color: COLORS.dangerText },
  actions: { flexDirection: "row", gap: SPACING.md },
  action: { flex: 1 },
  deleteText: { color: COLORS.dangerText }
});
