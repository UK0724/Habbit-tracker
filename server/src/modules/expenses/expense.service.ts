import { ExpenseModel, BudgetModel, IExpense } from "./expense.model.js";

export const expenseService = {
  getExpenses: async (userId: string) => {
    return ExpenseModel.find({ userId }).sort({ date: -1 });
  },

  addExpense: async (userId: string, data: Omit<IExpense, "userId">) => {
    const expense = new ExpenseModel({ ...data, userId });
    await expense.save();
    return expense;
  },

  updateExpense: async (
    userId: string,
    expenseId: string,
    data: Partial<Omit<IExpense, "userId">>
  ) => {
    const expense = await ExpenseModel.findOneAndUpdate(
      { _id: expenseId, userId },
      { $set: data },
      { new: true }
    );
    return expense;
  },

  deleteExpense: async (userId: string, expenseId: string) => {
    return ExpenseModel.findOneAndDelete({ _id: expenseId, userId });
  },

  getBudgets: async (userId: string) => {
    return BudgetModel.find({ userId });
  },

  setBudget: async (userId: string, category: string, monthlyLimit: number) => {
    const budget = await BudgetModel.findOneAndUpdate(
      { userId, category },
      { $set: { monthlyLimit } },
      { new: true, upsert: true }
    );
    return budget;
  }
};
