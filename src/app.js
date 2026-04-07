import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import mongoSanitize from '@exortek/express-mongo-sanitize'

import userRoutes from './routes/user.routes.js'
import AppError from './utils/appError.js'

const app = express()

app.use(helmet())

app.use(cors())

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: true, message: 'Demasiadas peticiones, intenta más tarde' }
}))

app.use(mongoSanitize())

app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/user', userRoutes)

app.use((req, res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`))
})

app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  res.status(status).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

export default app