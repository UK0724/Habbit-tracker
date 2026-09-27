import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface AuthRequest extends Request {
  userId: string;
}

export const requireAuth = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload === "string" || typeof payload.sub !== "string" || !/^[a-f0-9]{24}$/i.test(payload.sub)) {
      throw new Error("Invalid token subject");
    }
    (request as AuthRequest).userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
};
