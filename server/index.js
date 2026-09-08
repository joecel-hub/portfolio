import './env.js'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { seedIfEmpty } from './db.js'
import { UPLOAD_DIR } from './middleware/upload.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5175

import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import testimonialRoutes from './routes/testimonials.js'
import logoRoutes from './routes/logos.js'
import reviewRoutes from './routes/reviews.js'
import certificateRoutes from './routes/certificates.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))

seedIfEmpty()

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/logos', logoRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/certificates', certificateRoutes)

// Uploaded images (client logos, etc.)
app.use('/uploads', express.static(UPLOAD_DIR))

// Public client review page
app.get('/review', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'review', 'index.html'))
})

// Admin SPA (login + dashboard)
app.get('/admin', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin', 'index.html'))
})
app.use('/admin', express.static(join(__dirname, 'public', 'admin')))

// Built portfolio (dist) if present
const dist = join(__dirname, '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('{*path}', (_req, res, next) => {
    if (_req.path.startsWith('/api')) return next()
    res.sendFile(join(dist, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  if (err?.name === 'MulterError' || /allowed|too large/i.test(err?.message || '')) {
    return res.status(400).json({ error: err.message })
  }
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`\n  Stryg.Bytes CMS server running:`)
  console.log(`  • API        http://localhost:${PORT}/api/health`)
  console.log(`  • Admin      http://localhost:${PORT}/admin`)
  console.log(`  • Review     http://localhost:${PORT}/review`)
  console.log(`  • Portfolio  http://localhost:${PORT} (when dist/ built)\n`)
})
