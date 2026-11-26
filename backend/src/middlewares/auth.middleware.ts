import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { apiError } from "../utils/apiResponse.js";
import { Role, OwnerStatus } from "@prisma/client";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Check HttpOnly cookie first, then fallback to Authorization header
  const token =
    req.cookies?.auth_token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.substring(7)
      : null);

  if (!token) {
    apiError(res, "Authentication required. Please log in.", 401);
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    apiError(res, "Invalid or expired session. Please log in again.", 401);
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      apiError(res, "Authentication required", 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      apiError(res, "You do not have permission to access this resource", 403);
      return;
    }

    // If Hall Owner, check if approved
    if (req.user.role === Role.HALL_OWNER && req.user.status !== OwnerStatus.APPROVED) {
      apiError(
        res,
        `Your account status is ${req.user.status}. Only approved Hall Owners can manage halls and bookings.`,
        403
      );
      return;
    }

    next();
  };
}
