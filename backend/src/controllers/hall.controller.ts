import { Request, Response, NextFunction } from "express";
import { hallService } from "../services/hall.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";
import { HallStatus } from "@prisma/client";

export class HallController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const hall = await hallService.createHall(req.body, req.user);
      apiSuccess(res, { hall }, "Hall created successfully", 201);
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
      const search = req.query.search as string | undefined;
      const city = req.query.city as string | undefined;
      const status = req.query.status as HallStatus | undefined;
      const ownerId = req.query.ownerId as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await hallService.getAllHalls(
        { search, city, status, ownerId, page, limit },
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
      const hall = await hallService.getHallById(id, req.user);
      apiSuccess(res, { hall });
    } catch (err: unknown) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const hall = await hallService.updateHall(id, req.body, req.user);
      apiSuccess(res, { hall }, "Hall updated successfully");
    } catch (err: unknown) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      const { status } = req.body;
      const hall = await hallService.updateHallStatus(id, status, req.user.userId);
      apiSuccess(res, { hall }, `Hall status updated to ${status}`);
    } catch (err: unknown) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const id = req.params.id as string;
      await hallService.deleteHall(id, req.user);
      apiSuccess(res, null, "Hall deleted successfully");
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const hallController = new HallController();
