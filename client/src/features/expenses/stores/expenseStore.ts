import { create } from "zustand";
import { apiRequest } from "../../../services/api";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  paymentMethod: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
}

interface ExpenseState {
  expenses: Expense[];
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;

  fetchExpenses: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Omit<Expense, "id" | "createdAt">>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudgetLimit: (category: string, monthlyLimit: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  budgets: [],
  isLoading: false,
  error: null,

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<Expense[]>("/expenses");
      set({ expenses: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load expenses", isLoading: false });
    }
  },

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<Budget[]>("/expenses/budgets");
      set({ budgets: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || "Failed to load budgets", isLoading: false });
    }
  },

  addExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await apiRequest<Expense>("/expenses", {
        method: "POST",
        body: JSON.stringify(expense)
      });
      set({
        expenses: [newExpense, ...get().expenses],
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to add expense", isLoading: false });
      throw err;
    }
  },

  updateExpense: async (id, expense) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiRequest<Expense>(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify(expense)
      });
      set({
        expenses: get().expenses.map((e) => (e.id === id ? updated : e)),
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to update expense", isLoading: false });
      throw err;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequest<void>(`/expenses/${id}`, {
        method: "DELETE"
      });
      set({
        expenses: get().expenses.filter((e) => e.id !== id),
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to delete expense", isLoading: false });
      throw err;
    }
  },

  setBudgetLimit: async (category, monthlyLimit) => {
    set({ isLoading: true, error: null });
    try {
      const updatedBudget = await apiRequest<Budget>("/expenses/budgets", {
        method: "POST",
        body: JSON.stringify({ category, monthlyLimit })
      });
      const exists = get().budgets.some((b) => b.category === category);
      set({
        budgets: exists
          ? get().budgets.map((b) => (b.category === category ? updatedBudget : b))
          : [...get().budgets, updatedBudget],
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || "Failed to update budget limit", isLoading: false });
      throw err;
    }
  }
}));
