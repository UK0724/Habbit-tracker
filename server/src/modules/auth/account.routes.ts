import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

import { MongoRateLimitStore } from "../../middleware/mongoRateLimitStore.js";
import { requireAuth, type AuthRequest } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { deleteAccount } from "./account.service.js";

export const accountRouter = Router();
const deletionLimiter = rateLimit({
  store: new MongoRateLimitStore("account-delete"),
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." }
});
const deleteBodySchema = z.object({
  password: z.string().min(1, "Password is required")
});

// Required by Google Play for apps that let users create accounts.
accountRouter.delete(
  "/",
  requireAuth,
  deletionLimiter,
  validateRequest({ body: deleteBodySchema }),
  catchAsync(async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    await deleteAccount(userId, (request.body as { password: string }).password);
    response.status(204).end();
  })
);
