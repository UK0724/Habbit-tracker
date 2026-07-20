import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  getExpensesController,
  addExpenseController,
  updateExpenseController,
  deleteExpenseController,
  getBudgetsController,
  setBudgetController
} from "./expense.controller.js";

export const expenseRouter = Router();

expenseRouter.get("/", requireAuth, getExpensesController);
expenseRouter.post("/", requireAuth, addExpenseController);
expenseRouter.put("/:id", requireAuth, updateExpenseController);
expenseRouter.delete("/:id", requireAuth, deleteExpenseController);
expenseRouter.get("/budgets", requireAuth, getBudgetsController);
expenseRouter.post("/budgets", requireAuth, setBudgetController);
