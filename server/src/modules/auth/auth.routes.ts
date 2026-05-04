import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  getMeController,
  loginController,
  registerController
} from "./auth.controller.js";
import { loginBodySchema, registerBodySchema } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest({ body: registerBodySchema }),
  registerController
);

authRouter.post(
  "/login",
  validateRequest({ body: loginBodySchema }),
  loginController
);

authRouter.get("/me", requireAuth, getMeController);
