import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import AppError from './utils/appError.js';

const app = express();

// Seguridad HTTP
app.use(helmet());

// CORS
app.use(cors());

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
}));

// Body parser
app.use(express.json({ limit: '10kb' }));

// Sanitización NoSQL
app.use(mongoSanitize({ sanitizeObjects: ['params', 'body'] }));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Ruta no encontrada
app.use((req, res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

// Middleware centralizado de errores
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;