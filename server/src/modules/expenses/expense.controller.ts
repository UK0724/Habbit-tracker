import type { Request, Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
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

    if (amount === undefined || !category || !date || !paymentMethod) {
      response.status(400).json({ error: "amount, category, date, and paymentMethod are required" });
      return;
    }

    const expense = await expenseService.addExpense(userId, {
      amount: Number(amount),
      category,
      date,
      description: description || "",
      paymentMethod
    });
    response.status(201).json({ data: expense });
  }
);

export const updateExpenseController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const id = request.params.id as string;
    const { amount, category, date, description, paymentMethod } = request.body;

    if (!id) {
      response.status(400).json({ error: "expense ID is required" });
      return;
    }

    const data: any = {};
    if (amount !== undefined) data.amount = Number(amount);
    if (category) data.category = category;
    if (date) data.date = date;
    if (description !== undefined) data.description = description;
    if (paymentMethod) data.paymentMethod = paymentMethod;

    const expense = await expenseService.updateExpense(userId, id, data);
    response.json({ data: expense });
  }
);

export const deleteExpenseController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const id = request.params.id as string;

    if (!id) {
      response.status(400).json({ error: "expense ID is required" });
      return;
    }

    await expenseService.deleteExpense(userId, id);
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

    if (!category || monthlyLimit === undefined) {
      response.status(400).json({ error: "category and monthlyLimit are required" });
      return;
    }

    const budget = await expenseService.setBudget(userId, category, Number(monthlyLimit));
    response.json({ data: budget });
  }
);
