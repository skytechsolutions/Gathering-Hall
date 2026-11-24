import { Router } from "express";
import authRoutes from "./auth.routes.js";
import ownerRoutes from "./owner.routes.js";
import hallRoutes from "./hall.routes.js";
import bookingRoutes from "./booking.routes.js";
import customerRoutes from "./customer.routes.js";
import paymentRoutes from "./payment.routes.js";
import reportRoutes from "./report.routes.js";
import settingsRoutes from "./settings.routes.js";
import { prisma } from "../config/prisma.js";
import { apiSuccess, apiError } from "../utils/apiResponse.js";

const router = Router();

// System Health Endpoints
router.get("/health", (req, res) => {
  apiSuccess(res, { status: "UP", timestamp: new Date().toISOString() });
});

router.get("/health/database", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    apiSuccess(res, { database: "CONNECTED", timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    apiError(res, `Database check failed: ${msg}`, 500);
  }
});

// Domain Routes
router.use("/auth", authRoutes);
router.use("/owners", ownerRoutes);
router.use("/halls", hallRoutes);
router.use("/bookings", bookingRoutes);
router.use("/customers", customerRoutes);
router.use("/payments", paymentRoutes);
router.use("/reports", reportRoutes);
router.use("/settings", settingsRoutes);

export default router;
