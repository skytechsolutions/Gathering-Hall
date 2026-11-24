import { Router } from "express";
import { hallController } from "../controllers/hall.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createHallSchema, updateHallSchema, updateHallStatusSchema } from "../validators/hall.validator.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]),
  validate(createHallSchema),
  (req, res, next) => hallController.create(req, res, next)
);

router.get(
  "/",
  requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]),
  (req, res, next) => hallController.getAll(req, res, next)
);

router.get(
  "/:id",
  requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]),
  (req, res, next) => hallController.getById(req, res, next)
);

router.put(
  "/:id",
  requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]),
  validate(updateHallSchema),
  (req, res, next) => hallController.update(req, res, next)
);

router.delete(
  "/:id",
  requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]),
  (req, res, next) => hallController.delete(req, res, next)
);

// Only Super Admin can approve/reject/suspend halls
router.patch(
  "/:id/status",
  requireRole([Role.SUPER_ADMIN]),
  validate(updateHallStatusSchema),
  (req, res, next) => hallController.updateStatus(req, res, next)
);

export default router;
