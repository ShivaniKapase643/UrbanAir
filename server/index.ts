import compression from 'compression'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import type { ErrorRequestHandler } from 'express'
import path from 'node:path'
import { airQualityRouter } from './routes/air-quality.js'

const app = express()
const port = Number(process.env.PORT ?? 8787)
const allowedOrigins = new Set((process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173').split(',').map((value) => value.trim()))

app.disable('x-powered-by')
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"] },
  },
}))
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
})
app.use(compression())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) callback(null, true)
    else callback(new Error('Origin is not allowed'))
  },
}))
app.use(express.json({ limit: '16kb' }))
app.use(rateLimit({ windowMs: 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use('/api/air-quality', airQualityRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

const distDirectory = path.resolve(process.cwd(), 'dist')
app.use('/assets', express.static(path.join(distDirectory, 'assets'), {
  immutable: true,
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
}))
app.use(express.static(distDirectory, { index: false, maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }))
app.get('/', (_req, res) => {
  res.sendFile(path.join(distDirectory, 'index.html'))
})
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/assets/')) {
    res.status(404).json({ error: 'Static asset not found.' })
    return
  }
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(distDirectory, 'index.html'))
    return
  }
  next()
})

const errorHandler: ErrorRequestHandler = (_error, _req, res, next) => {
  void next
  res.status(502).json({ error: 'The upstream service is temporarily unavailable.' })
}
app.use(errorHandler)

export { app }

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Urban Air API and frontend listening on ${port}`))
}
