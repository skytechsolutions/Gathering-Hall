import { Response } from "express";

export function apiSuccess<T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function apiError(
  res: Response,
  message: string = "An error occurred",
  statusCode: number = 500,
  errors: unknown = null
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}
