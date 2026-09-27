import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  getMeController,
  loginController,
  registerController
} from "./auth.controller.js";
import { loginBodySchema, registerBodySchema } from "./auth.validation.js";

export const authRouter = Router();
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many registration attempts. Please try again in 15 minutes." }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many authentication attempts. Please try again in 15 minutes." }
});

authRouter.post(
  "/register",
  registrationLimiter,
  validateRequest({ body: registerBodySchema }),
  registerController
);

authRouter.post(
  "/login",
  loginLimiter,
  validateRequest({ body: loginBodySchema }),
  loginController
);

authRouter.get("/me", requireAuth, getMeController);
