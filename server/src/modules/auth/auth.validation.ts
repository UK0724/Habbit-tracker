import { z } from "zod";

const timezoneSchema = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone");

export const registerBodySchema = z.object({
  email: z.string().trim().max(254).email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must be at most 72 UTF-8 bytes"
    ),
  timezone: timezoneSchema.optional()
});

export const loginBodySchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
  timezone: timezoneSchema.optional()
});
