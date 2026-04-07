import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import notificationEmitter from '../services/notification.service.js';
import AppError from '../utils/appError.js';
import RefreshToken from '../models/refreshToken.js';


export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email, status: 'verified' });
    if (existing) throw AppError.conflict('El email ya está registrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      email,
      password: hashedPassword,
      verificationCode,
      verificationAttempts: 3
    });

    const accessToken = signToken({ _id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ _id: user._id });

    await RefreshToken.create({ token: refreshToken, user: user._id });

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

    const user = await User.findOne({ email, deleted: false }).select('+password');
    if (!user) throw AppError.unauthorized('Credenciales incorrectas');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw AppError.unauthorized('Credenciales incorrectas');

    const accessToken = signToken({ _id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ _id: user._id });

    await RefreshToken.create({ token: refreshToken, user: user._id });

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
export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif },
      { new: true }
    );

    res.json({ user });

  } catch (error) {
    next(error);
  }
};
import Company from '../models/company.js';

export const updateCompany = async (req, res, next) => {
  try {
    const { name, cif, isFreelance, address } = req.body;
    const user = req.user;

    let company;

    if (isFreelance) {
      // Autónomo: usa sus propios datos
      company = await Company.findOneAndUpdate(
        { cif: user.nif },
        {
          owner: user._id,
          name: user.name,
          cif: user.nif,
          address: user.address,
          isFreelance: true
        },
        { upsert: true, new: true }
      );
      user.role = 'admin';
    } else {
      // Buscar si ya existe una company con ese CIF
      const existing = await Company.findOne({ cif });

      if (existing) {
        // Unirse a company existente como guest
        company = existing;
        user.role = 'guest';
      } else {
        // Crear nueva company
        company = await Company.create({
          owner: user._id,
          name,
          cif,
          address,
          isFreelance: false
        });
        user.role = 'admin';
      }
    }

    user.company = company._id;
    await user.save();

    res.json({ company, role: user.role });

  } catch (error) {
    next(error);
  }
};
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest('No se ha subido ninguna imagen');

    const user = req.user;
    if (!user.company) throw AppError.badRequest('El usuario no tiene compañía asignada');

    const logoUrl = `${process.env.PUBLIC_URL}/uploads/${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(
      user.company,
      { logo: logoUrl },
      { new: true }
    );

    res.json({ logo: company.logo });

  } catch (error) {
    next(error);
  }
};
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('company');
    res.json({ data: user });
  } catch (err) {
    next(AppError.internal());
  }
};
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw AppError.badRequest('Refresh token requerido');

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) throw AppError.unauthorized('Refresh token inválido');

    const payload = verifyRefreshToken(refreshToken);
    const newToken = signToken({ _id: payload._id, role: payload.role });

    res.json({ token: newToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await RefreshToken.deleteOne({ token: refreshToken });
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(AppError.internal());
  }
};