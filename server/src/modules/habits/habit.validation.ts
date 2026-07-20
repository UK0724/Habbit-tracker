import { z } from "zod";

import { GOAL_DIRECTIONS, HABIT_TYPES } from "./habit.model.js";
import {
  dateStringSchemaMessage,
  isValidDateString
} from "../../utils/date.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const baseHabitSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z
    .string()
    .trim()
    .max(280, "Description must be 280 characters or less")
    .optional()
    .transform((value) => value || undefined),
  type: z.enum(HABIT_TYPES),
  unit: z
    .string()
    .trim()
    .max(20, "Unit must be 20 characters or less")
    .optional()
    .transform((value) => value || undefined),
  requireCompletionComment: z.boolean().optional(),
  linkToJobTracker: z.boolean().optional(),
  color: z.string().trim().min(1, "Color is required").max(40),
  goalDirection: z.enum(GOAL_DIRECTIONS).optional(),
  target: z
    .number({ invalid_type_error: "Target must be a number" })
    .finite()
    .positive("Target must be greater than zero")
    .optional()
});

export const createHabitBodySchema = baseHabitSchema.superRefine(
  (value, context) => {
    if (value.type === "measurable" && !value.unit) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "Unit is required for measurable habits"
      });
    }

    if (value.type === "action" && value.unit) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: "Action habits cannot define a unit"
      });
    }

    if (value.type !== "action" && value.requireCompletionComment) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requireCompletionComment"],
        message: "Completion comments are only available for action habits"
      });
    }
  }
);

export const updateHabitBodySchema = baseHabitSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const habitParamsSchema = z.object({
  id: objectIdSchema
});

export const archiveHabitBodySchema = z.object({
  archived: z.boolean()
});

export const listHabitsQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .refine(isValidDateString, dateStringSchemaMessage)
    .optional()
});
