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
        message: "A log already exists for this habit and date"
      });
    }
  }

  if (error instanceof Error) {
    return response.status(500).json({
      message: error.message || "Internal server error"
    });
  }

  return response.status(500).json({
    message: "Internal server error"
  });
};
