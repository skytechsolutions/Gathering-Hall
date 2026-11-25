import { Request, Response, NextFunction } from "express";
import { reportService } from "../services/report.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";

export class ReportController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const data = await reportService.getOverview(req.user);
      apiSuccess(res, data);
    } catch (err: unknown) {
      next(err);
    }
  }

  async getCommissionReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportService.getCommissionReports();
      apiSuccess(res, { report: data, ...data });
    } catch (err: unknown) {
      next(err);
    }
  }

  async getHallIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const data = await reportService.getHallIncomeReport(req.user);
      apiSuccess(res, { halls: data, reports: data });
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
