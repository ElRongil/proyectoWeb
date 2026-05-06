import { Router } from "express";
import { validate } from "../middleware/validate.js";
import authMiddleware from '../middleware/auth.middleware.js';
import { register, verifyEmail, login, updatePersonalData, updateCompany, uploadLogo , getUser, refresh, logout , deleteUser, changePassword, inviteUser} from '../controllers/user.controller.js';
import { registerSchema, validationCodeSchema, loginSchema, personalDataSchema, companySchema, changePasswordSchema, inviteUserSchema} from '../validators/user.validator.js';
import upload from '../middleware/upload.js';

const router = Router();

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Usuario]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Usuario creado. Devuelve accessToken y refreshToken.
 *       409:
 *         description: Email ya registrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /user/validation:
 *   put:
 *     summary: Verificar email con código de 6 dígitos
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, minLength: 6, maxLength: 6 }
 *     responses:
 *       200:
 *         description: Email verificado
 *       400:
 *         description: Código incorrecto o sin intentos
 */
router.put('/validation', authMiddleware, validate(validationCodeSchema), verifyEmail);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login
 *     tags: [Usuario]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login correcto. Devuelve accessToken y refreshToken.
 *       401:
 *         description: Credenciales incorrectas
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /user/register:
 *   put:
 *     summary: Actualizar datos personales
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lastName, nif]
 *             properties:
 *               name: { type: string }
 *               lastName: { type: string }
 *               nif: { type: string }
 *     responses:
 *       200:
 *         description: Datos actualizados
 */
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);

/**
 * @swagger
 * /user/company:
 *   patch:
 *     summary: Crear o unirse a una compañía
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *               isFreelance: { type: boolean }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200:
 *         description: Compañía creada o unida
 */
router.patch('/company', authMiddleware, validate(companySchema), updateCompany);

/**
 * @swagger
 * /user/logo:
 *   patch:
 *     summary: Subir logo de la compañía
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo subido. Devuelve URL del logo.
 */
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags: [Usuario]
 *     responses:
 *       200:
 *         description: Datos del usuario con compañía
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/User' }
 */
router.get('/', authMiddleware, getUser);

/**
 * @swagger
 * /user/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Usuario]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nuevo access token
 *       401:
 *         description: Refresh token inválido
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /user:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuario]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema: { type: boolean }
 *         description: Si true, soft delete (marca deleted=true)
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/', authMiddleware, deleteUser);

/**
 * @swagger
 * /user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword);

/**
 * @swagger
 * /user/invite:
 *   post:
 *     summary: Invitar usuario a la compañía (solo admin)
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201:
 *         description: Usuario invitado correctamente
 *       403:
 *         description: Solo administradores pueden invitar
 */
router.post('/invite', authMiddleware, validate(inviteUserSchema), inviteUser);

export default router;
