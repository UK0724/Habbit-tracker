import type { Request, Response } from "express";

import type { AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { getMe, login, register } from "./auth.service.js";

export const registerController = catchAsync(
  async (request: Request, response: Response) => {
    const { email, password, timezone } = request.body as {
      email: string;
      password: string;
      timezone?: string;
    };
    const result = await register(email, password, timezone);
    response.status(201).json({ data: result });
  }
);

export const loginController = catchAsync(
  async (request: Request, response: Response) => {
    const { email, password, timezone } = request.body as {
      email: string;
      password: string;
      timezone?: string;
    };
    const result = await login(email, password, timezone);
    response.json({ data: result });
  }
);

export const getMeController = catchAsync(
  async (request: Request, response: Response) => {
    const { userId } = request as AuthRequest;
    const user = await getMe(userId);
    response.json({ data: user });
  }
);
