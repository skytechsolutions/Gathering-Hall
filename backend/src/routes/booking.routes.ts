import { Router } from "express";
import { bookingController } from "../controllers/booking.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBookingSchema,
  confirmBookingSchema,
  extendHoldSchema,
  blockDateSchema,
} from "../validators/booking.validator.js";
import { Role } from "@prisma/client";

const router = Router();

// Availability check for calendar - accessible to logged-in users
router.get("/availability", authenticate, (req, res, next) =>
  bookingController.getAvailability(req, res, next)
);

router.use(authenticate, requireRole([Role.SUPER_ADMIN, Role.HALL_OWNER]));

router.post("/", validate(createBookingSchema), (req, res, next) =>
  bookingController.create(req, res, next)
);

router.get("/", (req, res, next) => bookingController.getAll(req, res, next));
router.get("/:id", (req, res, next) => bookingController.getById(req, res, next));

router.patch("/:id/confirm", validate(confirmBookingSchema), (req, res, next) =>
  bookingController.confirm(req, res, next)
);

router.patch("/:id/cancel", (req, res, next) =>
  bookingController.cancel(req, res, next)
);

router.patch("/:id/hold", validate(extendHoldSchema), (req, res, next) =>
  bookingController.extendHold(req, res, next)
);

router.post("/block-date", validate(blockDateSchema), (req, res, next) =>
  bookingController.blockDate(req, res, next)
);

router.delete("/block-date/:id", (req, res, next) =>
  bookingController.unblockDate(req, res, next)
);

export default router;
