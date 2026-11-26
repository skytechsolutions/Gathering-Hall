import { Request, Response, NextFunction } from "express";
import { settingsService } from "../services/settings.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";

export class SettingsController {
  async getCommission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await settingsService.getCommission();
      apiSuccess(res, data);
    } catch (err: unknown) {
      next(err);
    }
  }

  async updateCommission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const { rate } = req.body;
      const data = await settingsService.updateCommission(rate, req.user.userId);
      apiSuccess(res, data, `Global commission rate updated to ${rate}%`);
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const settingsController = new SettingsController();
