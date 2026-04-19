import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject, ZodSchema } from "zod";

type RequestShape = {
  body?: ZodSchema;
  params?: AnyZodObject;
  query?: AnyZodObject;
};

export const validateRequest =
  (schemas: RequestShape) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }

    if (schemas.params) {
      request.params = schemas.params.parse(request.params);
    }

    if (schemas.query) {
      const parsedQuery = schemas.query.parse(request.query);

      Object.assign(request.query as Record<string, unknown>, parsedQuery);
    }

    next();
  };
