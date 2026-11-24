import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { apiError } from "../utils/apiResponse.js";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formatted = err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        apiError(res, "Validation failed", 400, formatted);
        return;
      }
      apiError(res, "Invalid request", 400);
    }
  };
}
