import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useExpenseStore } from "../stores/expenseStore";

export const ExpenseLayout = () => {
  const { fetchExpenses, fetchBudgets } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
    fetchBudgets();
  }, [fetchExpenses, fetchBudgets]);

  return (
    <div className="w-full min-w-0">
      <Outlet />
    </div>
  );
};
