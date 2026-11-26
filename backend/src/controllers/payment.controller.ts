import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";

export class PaymentController {
  async addPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const payment = await paymentService.addPayment(req.body, req.user);
      apiSuccess(res, { payment }, "Payment recorded successfully", 201);
    } catch (err: unknown) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const bookingId = req.query.bookingId as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await paymentService.getAllPayments({ bookingId, page, limit }, req.user);
      apiSuccess(res, result);
    } catch (err: unknown) {
      next(err);
    }
  }

  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const reason = req.body?.reason || "Requested refund";
      const payment = await paymentService.refundPayment(id, reason, req.user);
      apiSuccess(res, { payment }, "Payment refunded successfully");
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
