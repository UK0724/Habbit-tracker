import { Schema, model } from "mongoose";

export interface IExpense {
  userId: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  paymentMethod: string; // Cash, Card, UPI
}

export interface IBudget {
  userId: string;
  category: string;
  monthlyLimit: number;
}

const expenseSchema = new Schema<IExpense>({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  paymentMethod: { type: String, required: true }
}, { timestamps: true });

const budgetSchema = new Schema<IBudget>({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  monthlyLimit: { type: Number, required: true }
}, { timestamps: true });

budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export const ExpenseModel = model<IExpense>("Expense", expenseSchema);
export const BudgetModel = model<IBudget>("Budget", budgetSchema);
