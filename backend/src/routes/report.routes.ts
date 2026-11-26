import { Router } from "express";
import { reportController } from "../controllers/report.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate, requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]));

router.get("/overview", (req, res, next) => reportController.getOverview(req, res, next));
router.get("/halls", (req, res, next) => reportController.getHallIncome(req, res, next));

// Commission reports are Super Admin only
router.get(
  "/commission",
  requireRole([Role.SUPER_ADMIN]),
  (req, res, next) => reportController.getCommissionReports(req, res, next)
);

export default router;
