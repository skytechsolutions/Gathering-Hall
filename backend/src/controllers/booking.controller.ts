import { Request, Response, NextFunction } from "express";
import { bookingService } from "../services/booking.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";
import { BookingStatus } from "@prisma/client";

export class BookingController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const booking = await bookingService.createBooking(req.body, req.user);
      apiSuccess(res, { booking }, "Booking created successfully", 201);
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
      const hallId = req.query.hallId as string | undefined;
      const ownerId = req.query.ownerId as string | undefined;
      const status = req.query.status as BookingStatus | undefined;
      const search = req.query.search as string | undefined;
      const eventDate = req.query.eventDate as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await bookingService.getAllBookings(
        { hallId, ownerId, status, search, eventDate, page, limit },
        req.user
      );
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
      const booking = await bookingService.getBookingById(id, req.user);
      apiSuccess(res, { booking });
    } catch (err: unknown) {
      next(err);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const booking = await bookingService.confirmBooking(id, req.body, req.user);
      apiSuccess(res, { booking }, "Booking confirmed successfully");
    } catch (err: unknown) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const reason = req.body?.reason;
      const booking = await bookingService.cancelBooking(id, req.user, reason);
      apiSuccess(res, { booking }, "Booking cancelled and date released");
    } catch (err: unknown) {
      next(err);
    }
  }

  async extendHold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const additionalHours = req.body.additionalHours || 24;
      const booking = await bookingService.extendHold(id, additionalHours, req.user);
      apiSuccess(res, { booking }, `Hold extended by ${additionalHours} hours`);
    } catch (err: unknown) {
      next(err);
    }
  }

  async blockDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const blocked = await bookingService.blockDate(req.body, req.user);
      apiSuccess(res, { blocked }, "Date blocked successfully", 201);
    } catch (err: unknown) {
      next(err);
    }
  }

  async unblockDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      await bookingService.unblockDate(id, req.user);
      apiSuccess(res, null, "Date unblocked successfully");
    } catch (err: unknown) {
      next(err);
    }
  }

  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hallId = req.query.hallId as string;
      if (!hallId) {
        apiError(res, "hallId query parameter is required", 400);
        return;
      }

      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;

      const availability = await bookingService.getAvailability(hallId, year, month, req.user);
      apiSuccess(res, availability);
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const bookingController = new BookingController();
