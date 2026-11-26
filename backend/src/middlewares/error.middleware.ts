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

  // Prisma Unique constraint violation (P2002) or PostgreSQL 23505
  if (err.code === "P2002" || err.code === "23505") {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : String(err.meta?.target || "");
    if (target.includes("hallId") || target.includes("eventDate") || String(err.message).includes("uq_hall_active")) {
      apiError(res, "Already Booked: The selected session (Day or Night) is already reserved on this date.", 409);
      return;
    }
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
