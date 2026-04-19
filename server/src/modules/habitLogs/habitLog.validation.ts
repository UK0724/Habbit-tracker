import { z } from "zod";

import { ACTION_STATUSES } from "./habitLog.model.js";
import {
  dateStringSchemaMessage,
  isValidDateString
} from "../../utils/date.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const baseLogSchema = z.object({
  date: z.string().trim().refine(isValidDateString, dateStringSchemaMessage),
  status: z.enum(ACTION_STATUSES).nullable().optional(),
  value: z
    .number({
      invalid_type_error: "Value must be numeric"
    })
    .finite("Value must be a finite number")
    .nullable()
    .optional()
});

export const createHabitLogBodySchema = baseLogSchema.superRefine(
  (value, context) => {
    if (value.status === undefined && value.value === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "Either status or value is required"
      });
    }
  }
);

export const updateHabitLogBodySchema = baseLogSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const habitLogParamsSchema = z.object({
  id: objectIdSchema
});

export const habitLogUpdateParamsSchema = z.object({
  id: objectIdSchema,
  logId: objectIdSchema
});

export const habitLogListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(30).optional()
});
