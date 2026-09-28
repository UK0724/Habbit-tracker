import { Alert } from "react-native";
import { formatRupees, type Expense } from "../../services/expenses";

/** Native confirmation before deleting; `onConfirm` runs only on "Delete". */
export const confirmDeleteExpense = (expense: Expense, onConfirm: () => void) => {
  Alert.alert(
    "Delete expense?",
    `Delete this ${formatRupees(expense.amount)} ${expense.category} expense? This can't be undone.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm }
    ],
    { cancelable: true }
  );
};
