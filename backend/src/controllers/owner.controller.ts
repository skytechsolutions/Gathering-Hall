import { Request, Response, NextFunction } from "express";
import { ownerService } from "../services/owner.service.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";
import { OwnerStatus } from "@prisma/client";

export class OwnerController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        apiError(res, "Authentication required", 401);
        return;
      }
      const owner = await ownerService.createOwner(req.body, req.user.userId);
      apiSuccess(res, { owner }, "Hall Owner created successfully", 201);
    } catch (err: unknown) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as OwnerStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await ownerService.getAllOwners({ search, status, page, limit });
      apiSuccess(res, result);
    } catch (err: unknown) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const owner = await ownerService.getOwnerById(id);
      apiSuccess(res, { owner });
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
      const owner = await ownerService.updateOwner(id, req.body, req.user.userId);
      apiSuccess(res, { owner }, "Owner updated successfully");
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
      const owner = await ownerService.updateOwnerStatus(id, status, req.user.userId);
      apiSuccess(res, { owner }, `Owner status updated to ${status}`);
    } catch (err: unknown) {
      next(err);
    }
  }
}

export const ownerController = new OwnerController();
