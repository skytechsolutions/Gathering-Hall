import { Router } from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPaymentSchema } from "../validators/payment.validator.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate, requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]));

router.post("/", validate(createPaymentSchema), (req, res, next) =>
  paymentController.addPayment(req, res, next)
);

router.get("/", (req, res, next) => paymentController.getAll(req, res, next));
router.post("/:id/refund", (req, res, next) => paymentController.refund(req, res, next));

export default router;
