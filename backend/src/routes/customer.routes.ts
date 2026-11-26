import { Router } from "express";
import { customerController } from "../controllers/customer.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate, requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]));

router.get("/", (req, res, next) => customerController.getAll(req, res, next));
router.get("/search", (req, res, next) => customerController.getAll(req, res, next));
router.get("/:id", (req, res, next) => customerController.getById(req, res, next));
router.get("/:id/bookings", (req, res, next) => customerController.getBookings(req, res, next));
router.get("/:id/ledger", (req, res, next) => customerController.getLedger(req, res, next));

export default router;
