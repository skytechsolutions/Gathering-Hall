import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      apiSuccess(res, result, result.message, 201);
    } catch (err: unknown) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const result = await authService.login(email, password, ip);

      // Set secure HTTP-only cookies
      setAuthCookies(res, result.accessToken, result.refreshToken);

      apiSuccess(
        res,
        { user: result.user, token: result.accessToken },
        "Logged in successfully"
      );
    } catch (err: unknown) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      if (!refreshToken) {
        apiError(res, "Refresh token required", 401);
        return;
      }

      const result = await authService.refreshToken(refreshToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      apiSuccess(res, { token: result.accessToken }, "Session refreshed");
    } catch (err: unknown) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const refreshToken = req.cookies?.refresh_token;

      if (userId) {
        await authService.logout(userId, refreshToken);
      }

      clearAuthCookies(res);
      apiSuccess(res, null, "Logged out successfully");
    } catch (err: unknown) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const user = await authService.getMe(req.user.userId);
      apiSuccess(res, { user });
    } catch (err: unknown) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const { name, phone } = req.body;
      const user = await authService.updateProfile(req.user.userId, { name, phone });
      apiSuccess(res, { user }, "Profile updated successfully");
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const authController = new AuthController();
