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

// The client keys rows off `id`; without this Mongoose serializes `_id` only
// and edit/delete send `undefined` as the route param.
const idTransform = {
  virtuals: true,
  versionKey: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: unknown, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  }
};

expenseSchema.set("toJSON", idTransform);
budgetSchema.set("toJSON", idTransform);

export const ExpenseModel = model<IExpense>("Expense", expenseSchema);
export const BudgetModel = model<IBudget>("Budget", budgetSchema);
