import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../utils/appError.js";

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  void _next;

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const mongooseError = error as { code?: number };

    if (mongooseError.code === 11000) {
      return response.status(409).json({
        message: "A record with these details already exists"
      });
    }
  }

  if (error instanceof Error && (error.name === "CastError" || error.name === "ValidationError")) {
    return response.status(400).json({ message: "Invalid request data" });
  }
  if (typeof error === "object" && error !== null && "type" in error) {
    if (error.type === "entity.parse.failed") return response.status(400).json({ message: "Invalid JSON body" });
    if (error.type === "entity.too.large") return response.status(413).json({ message: "Request body is too large" });
  }
  console.error("Unhandled request error", error);

  return response.status(500).json({
    message: "Internal server error"
  });
};
