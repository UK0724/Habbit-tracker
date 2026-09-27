import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_CONTACT_EMAIL: z.string().optional().default("admin@habittracker.app")
  })
  .superRefine((value, ctx) => {
    if (
      value.NODE_ENV === "production" &&
      (value.JWT_SECRET.length < 32 ||
        /change.this|example|secret-not-for-production/i.test(value.JWT_SECRET))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "Use a random production secret of at least 32 characters"
      });
    }
    for (const origin of value.CLIENT_ORIGIN.split(",")) {
      try {
        const url = new URL(origin.trim());
        if (
          url.origin !== origin.trim() ||
          (value.NODE_ENV === "production" && url.protocol !== "https:")
        )
          throw new Error();
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CLIENT_ORIGIN"],
          message:
            "Use exact origins (HTTPS in production), without paths or trailing slashes"
        });
      }
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missingVariables = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid server environment: ${missingVariables}`);
}

export const env = parsedEnv.data;

export const clientOrigins = env.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
