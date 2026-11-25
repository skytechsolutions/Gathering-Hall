import { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customer.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";

export class CustomerController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await customerService.getAllCustomers({ search, page, limit }, req.user);
      apiSuccess(res, result);
    } catch (err: unknown) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const result = await customerService.getCustomerById(id, req.user);
      apiSuccess(res, result);
    } catch (err: unknown) {
      next(err);
    }
  }

  async getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const bookings = await customerService.getCustomerBookings(id, req.user);
      apiSuccess(res, { bookings });
    } catch (err: unknown) {
      next(err);
    }
  }

  async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const result = await customerService.getCustomerById(id, req.user);
      apiSuccess(res, {
        customer: result.customer,
        totalBilled: result.ledger.totalBilled,
        totalPaid: result.ledger.totalPaid,
        remainingBalance: result.ledger.totalRemaining,
        bookingsCount: result.ledger.bookingsCount,
        bookings: result.bookings,
        ledger: result.ledger,
      });
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const customerController = new CustomerController();
