import { Router } from "express";
import { register } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema } from "../validators/user.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

export default router;