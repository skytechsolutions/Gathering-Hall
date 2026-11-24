import { Request, Response, NextFunction } from "express";
import { apiError } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Server Error:", err);

  // PostgreSQL unique constraint violation error code
  if (err.code === "23505") {
    apiError(res, "A record with this value already exists.", 409);
    return;
  }

  // PostgreSQL foreign key violation error code
  if (err.code === "23503") {
    apiError(res, "Cannot complete operation: referenced record does not exist or is in use.", 400);
    return;
  }

  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const message =
    err.message || "An unexpected internal server error occurred.";

  apiError(
    res,
    message,
    statusCode,
    env.NODE_ENV === "development" ? err.stack : null
  );
}
