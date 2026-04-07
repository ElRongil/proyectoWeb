import { Router } from "express";
import { validate } from "../middleware/validate.js";
import authMiddleware from '../middleware/auth.middleware.js';
import { register, verifyEmail, login } from '../controllers/user.controller.js';
import { registerSchema, validationCodeSchema, loginSchema } from '../validators/user.validator.js';



const router = Router();

router.post("/register", validate(registerSchema), register);
router.put('/validation', authMiddleware, validate(validationCodeSchema), verifyEmail);
router.post('/login', validate(loginSchema), login);

export default router;