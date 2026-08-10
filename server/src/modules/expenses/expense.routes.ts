import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  getExpensesController,
  addExpenseController,
  updateExpenseController,
  deleteExpenseController,
  getBudgetsController,
  setBudgetController
} from "./expense.controller.js";
import {
  createExpenseBodySchema,
  expenseParamsSchema,
  setBudgetBodySchema,
  updateExpenseBodySchema
} from "./expense.validation.js";

export const expenseRouter = Router();

expenseRouter.use(requireAuth);

expenseRouter.get("/", getExpensesController);

expenseRouter.post(
  "/",
  validateRequest({ body: createExpenseBodySchema }),
  addExpenseController
);

expenseRouter.get("/budgets", getBudgetsController);

expenseRouter.post(
  "/budgets",
  validateRequest({ body: setBudgetBodySchema }),
  setBudgetController
);

expenseRouter.put(
  "/:id",
  validateRequest({
    params: expenseParamsSchema,
    body: updateExpenseBodySchema
  }),
  updateExpenseController
);

expenseRouter.delete(
  "/:id",
  validateRequest({ params: expenseParamsSchema }),
  deleteExpenseController
);
