import { Router } from "express";
import { validate } from "../middleware/validate.js";
import authMiddleware from '../middleware/auth.middleware.js';
import { register, verifyEmail, login, updatePersonalData, updateCompany, uploadLogo , getUser, refresh, logout , deleteUser, changePassword, inviteUser} from '../controllers/user.controller.js';
import { registerSchema, validationCodeSchema, loginSchema, personalDataSchema, companySchema, changePasswordSchema, inviteUserSchema} from '../validators/user.validator.js';
import upload from '../middleware/upload.js';







const router = Router();

router.post("/register", validate(registerSchema), register);
router.put('/validation', authMiddleware, validate(validationCodeSchema), verifyEmail);
router.post('/login', validate(loginSchema), login);
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);
router.patch('/company', authMiddleware, validate(companySchema), updateCompany);
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);
router.get('/', authMiddleware, getUser);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.delete('/', authMiddleware, deleteUser);
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword);
router.post('/invite', authMiddleware, validate(inviteUserSchema), inviteUser);

export default router;