import { ZodError } from 'zod';
import AppError from '../utils/appError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map(i => i.message).join(', ');
      return next(AppError.badRequest(message));
    }
    next(error);
  }
};