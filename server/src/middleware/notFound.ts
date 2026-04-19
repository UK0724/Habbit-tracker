import type { Request, Response } from "express";

export const notFoundHandler = (request: Request, response: Response) => {
  response.status(404).json({
    message: `Route not found: ${request.method} ${request.originalUrl}`
  });
};
