import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { expenseService } from "./expense.service.js";

export const getExpensesController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const expenses = await expenseService.getExpenses(userId);
    response.json({ data: expenses });
  }
);

export const addExpenseController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const { amount, category, date, description, paymentMethod } = request.body;

    const expense = await expenseService.addExpense(userId, {
      amount,
      category,
      date,
      description: description ?? "",
      paymentMethod
    });
    response.status(201).json({ data: expense });
  }
);

export const updateExpenseController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const id = request.params.id as string;

    const expense = await expenseService.updateExpense(userId, id, request.body);
    if (!expense) {
      throw new AppError("Expense not found", 404);
    }

    response.json({ data: expense });
  }
);

export const deleteExpenseController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const id = request.params.id as string;

    const deleted = await expenseService.deleteExpense(userId, id);
    if (!deleted) {
      throw new AppError("Expense not found", 404);
    }

    response.status(204).send();
  }
);

export const getBudgetsController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const budgets = await expenseService.getBudgets(userId);
    response.json({ data: budgets });
  }
);

export const setBudgetController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const { category, monthlyLimit } = request.body;

    const budget = await expenseService.setBudget(userId, category, monthlyLimit);
    response.json({ data: budget });
  }
);
