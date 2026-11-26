import { Router } from "express";
import { ownerController } from "../controllers/owner.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOwnerSchema, updateOwnerSchema, updateOwnerStatusSchema } from "../validators/owner.validator.js";
import { Role } from "@prisma/client";

const router = Router();

// Only Super Admin can manage Hall Owners
router.use(authenticate, requireRole([Role.SUPER_ADMIN]));

router.post("/", validate(createOwnerSchema), (req, res, next) =>
  ownerController.create(req, res, next)
);

router.get("/", (req, res, next) => ownerController.getAll(req, res, next));
router.get("/:id", (req, res, next) => ownerController.getById(req, res, next));

router.put("/:id", validate(updateOwnerSchema), (req, res, next) =>
  ownerController.update(req, res, next)
);

router.patch("/:id/status", validate(updateOwnerStatusSchema), (req, res, next) =>
  ownerController.updateStatus(req, res, next)
);

router.post("/:id/reset-password", (req, res, next) =>
  ownerController.resetPassword(req, res, next)
);

router.get("/:id/activities", (req, res, next) =>
  ownerController.getActivities(req, res, next)
);

export default router;
