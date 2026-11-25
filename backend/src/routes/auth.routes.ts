import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/login", validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post("/refresh", (req, res, next) => authController.refresh(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));
router.get("/me", authenticate, (req, res, next) => authController.getMe(req, res, next));
router.put("/profile", authenticate, (req, res, next) =>
  authController.updateProfile(req, res, next)
);

export default router;
