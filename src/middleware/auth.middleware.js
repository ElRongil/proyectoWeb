import { verifyToken } from '../utils/jwt.js';
import User from '../models/user.js';
import AppError from '../utils/appError.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Token requerido');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded._id);
    if (!user || user.deleted) throw AppError.unauthorized('Usuario no encontrado');

    req.user = user;
    next();
  } catch (error) {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
};

export default authMiddleware;