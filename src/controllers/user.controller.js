import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { signToken, signRefreshToken } from '../utils/jwt.js';
import notificationEmitter from '../services/notification.service.js';
import AppError from '../utils/appError.js';

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verificar si el email ya existe y está verificado
    const existing = await User.findOne({ email, status: 'verified' });
    if (existing) throw AppError.conflict('El email ya está registrado');

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar código de verificación de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Crear usuario
    const user = await User.create({
      email,
      password: hashedPassword,
      verificationCode,
      verificationAttempts: 3
    });

    // Generar tokens
    const accessToken = signToken({ _id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ _id: user._id });

    // Guardar refresh token en el usuario
    user.refreshToken = refreshToken;
    await user.save();

    // Emitir evento
    notificationEmitter.emit('user:registered', user);

    res.status(201).json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken
    });

  } catch (error) {
    next(error);
  }
};
export const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (user.verificationAttempts <= 0) {
      throw AppError.tooMany('Has agotado los intentos de verificación');
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();
      throw AppError.badRequest(`Código incorrecto. Intentos restantes: ${user.verificationAttempts}`);
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    await user.save();

    notificationEmitter.emit('user:verified', user);

    res.json({ message: 'Email verificado correctamente' });

  } catch (error) {
    next(error);
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario con password (select: false por defecto)
    const user = await User.findOne({ email, deleted: false }).select('+password');
    if (!user) throw AppError.unauthorized('Credenciales incorrectas');

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw AppError.unauthorized('Credenciales incorrectas');

    // Generar tokens
    const accessToken = signToken({ _id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ _id: user._id });

    // Guardar refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Emitir evento
    notificationEmitter.emit('user:logged', user);

    res.json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken
    });

  } catch (error) {
    next(error);
  }
};