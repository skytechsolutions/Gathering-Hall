import { Router } from "express";
import { settingsController } from "../controllers/settings.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateCommissionSchema } from "../validators/settings.validator.js";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate, requireRole([Role.SUPER_ADMIN]));

router.get("/commission", (req, res, next) => settingsController.getCommission(req, res, next));
router.put(
  "/commission",
  validate(updateCommissionSchema),
  (req, res, next) => settingsController.updateCommission(req, res, next)
);

export default router;
