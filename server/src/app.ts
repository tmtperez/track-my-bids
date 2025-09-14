// server/src/app.ts
import express from 'express'
import cors from 'cors'
import path from 'path'

import { auth } from './routes/auth.js'
import { authRequired } from './middleware/auth.js'
import { bids } from './routes/bids.js'
import { companies } from './routes/companies.js'
import { contacts } from './routes/contacts.js'
import { charts } from './routes/charts.js'
import { importer } from './routes/import.js'
import { errorHandler } from './middleware/error.js'

const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false,
  optionsSuccessStatus: 204,
}


export function createApp() {
  const app = express()

  // --- Middleware order matters ---
  // Enable CORS first (allow preflight)
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  )

  // Let OPTIONS requests through (important for preflight)
  app.options('*', cors())

  // JSON body parser
  app.use(express.json({ limit: '5mb' }))

  // Static uploads
  app.use('/uploads', express.static(path.resolve('uploads')))

  // --- Routes ---
  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/auth', auth)

  // Protect the rest with authRequired
  app.use('/api/bids', authRequired, bids)
  app.use('/api/companies', authRequired, companies)
  app.use('/api/contacts', authRequired, contacts)
  app.use('/api/charts', authRequired, charts)
  app.use('/api/import', authRequired, importer)
  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions)) // <= important for preflight

  // Error handler at the end
  app.use(errorHandler)

  return app
}
