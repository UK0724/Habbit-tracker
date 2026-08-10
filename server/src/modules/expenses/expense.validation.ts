import { z } from "zod";

import {
  dateStringSchemaMessage,
  isValidDateString
} from "../../utils/date.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const baseExpenseSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be numeric" })
    .finite("Amount must be a finite number")
    .nonnegative("Amount cannot be negative"),
  category: z.string().trim().min(1, "Category is required").max(60),
  date: z.string().trim().refine(isValidDateString, dateStringSchemaMessage),
  description: z.string().trim().max(280).optional(),
  paymentMethod: z
    .string()
    .trim()
    .min(1, "Payment method is required")
    .max(40)
});

export const createExpenseBodySchema = baseExpenseSchema;

export const updateExpenseBodySchema = baseExpenseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const expenseParamsSchema = z.object({
  id: objectIdSchema
});

export const setBudgetBodySchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(60),
  monthlyLimit: z.coerce
    .number({ invalid_type_error: "Monthly limit must be numeric" })
    .finite("Monthly limit must be a finite number")
    .nonnegative("Monthly limit cannot be negative")
});
