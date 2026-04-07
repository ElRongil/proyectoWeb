import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

const app = express();

// Seguridad HTTP
app.use(helmet());

// CORS
app.use(cors());

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
}));

// Body parser
app.use(express.json({ limit: '10kb' }));

// Sanitización NoSQL
app.use(mongoSanitize());

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Middleware de errores (se completará más adelante)
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ error: true, message });
});

export default app;