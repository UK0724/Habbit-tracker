import { z } from "zod";

// Problems are keyed by a numeric catalog id, not an ObjectId. Kept as a
// string here because validateRequest writes the parsed value back onto
// request.params, which Express types as a string dictionary.
export const problemParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid problem id")
});

const problemIdSchema = z.coerce
  .number({ invalid_type_error: "problemId must be numeric" })
  .int("problemId must be an integer")
  .positive("problemId must be positive");

export const markSolvedBodySchema = z.object({
  problemId: problemIdSchema,
  language: z.string().trim().min(1, "Language is required").max(40),
  notes: z.string().trim().max(5000).optional()
});

export const unmarkSolvedBodySchema = z.object({
  problemId: problemIdSchema
});
