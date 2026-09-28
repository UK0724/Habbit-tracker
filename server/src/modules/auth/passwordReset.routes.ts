import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

import { MongoRateLimitStore } from "../../middleware/mongoRateLimitStore.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { registerBodySchema } from "./auth.validation.js";
import { requestPasswordReset, resetPassword } from "./passwordReset.service.js";

export const passwordResetRouter = Router();
const limiter = (prefix: string, limit: number) =>
  rateLimit({
    store: new MongoRateLimitStore(prefix),
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in 15 minutes." }
  });

passwordResetRouter.post(
  "/forgot-password",
  limiter("forgot-password", 5),
  validateRequest({ body: z.object({ email: z.string().trim().max(254).email("Invalid email") }) }),
  catchAsync(async (request: Request, response: Response) => {
    await requestPasswordReset((request.body as { email: string }).email);
    response.json({ data: { sent: true } });
  })
);

passwordResetRouter.post(
  "/reset-password",
  limiter("reset-password", 10),
  validateRequest({
    body: z.object({
      token: z.string().min(20).max(200),
      password: registerBodySchema.shape.password
    })
  }),
  catchAsync(async (request: Request, response: Response) => {
    const { token, password } = request.body as { token: string; password: string };
    await resetPassword(token, password);
    response.json({ data: { reset: true } });
  })
);
