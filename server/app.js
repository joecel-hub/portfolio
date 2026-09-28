import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { seedIfEmpty } from './db.js'
import { UPLOAD_DIR } from './middleware/upload.js'

import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import testimonialRoutes from './routes/testimonials.js'
import logoRoutes from './routes/logos.js'
import reviewRoutes from './routes/reviews.js'
import certificateRoutes from './routes/certificates.js'
import hobbyClipRoutes from './routes/hobbyClips.js'
import contactRoutes from './routes/contact.js'
import { toLabHtml } from './labHtml.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

seedIfEmpty()

export const app = express()
app.disable('x-powered-by')
// Behind Render's proxy, trust the first X-Forwarded-For hop so req.ip is the
// real visitor — otherwise every visitor shares one rate-limit bucket.
// Override with TRUST_PROXY (a hop count); off by default outside production.
const trustProxy = process.env.TRUST_PROXY ?? (process.env.NODE_ENV === 'production' ? '1' : '')
if (trustProxy !== '' && trustProxy !== '0') app.set('trust proxy', Number(trustProxy) || trustProxy)
app.use(cors())
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/logos', logoRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/hobby-clips', hobbyClipRoutes)
app.use('/api/contact', contactRoutes)

// Uploaded images (client logos, etc.)
app.use('/uploads', express.static(UPLOAD_DIR))

// Public client review page
app.get('/review', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'review', 'index.html'))
})

// Static legal pages (must be registered before the dist SPA catch-all)
const legalPages = ['privacy', 'terms', 'cookies', 'refund']
for (const page of legalPages) {
  app.get(`/${page}`, (_req, res) => {
    res.sendFile(join(__dirname, 'public', page, 'index.html'))
  })
}

// Admin SPA (login + dashboard)
app.get('/admin', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin', 'index.html'))
})
app.use('/admin', express.static(join(__dirname, 'public', 'admin')))

// Built portfolio (dist) if present
const dist = join(__dirname, '..', 'dist')
if (existsSync(dist)) {
  // Vite content-hashes everything under /assets/, so a file there never
  // changes under the same name: cache it for a year. HTML is revalidated on
  // every visit so a deploy shows immediately.
  const NO_CACHE = 'no-cache'
  const assetsDir = join(dist, 'assets')
  app.use(express.static(dist, {
    setHeaders(res, filePath) {
      res.setHeader('Cache-Control', filePath.startsWith(assetsDir)
        ? 'public, max-age=31536000, immutable'
        : NO_CACHE)
    }
  }))
  // /lab gets the same page with the lab's title/description/canonical in
  // the head, so shared links preview as Stryg.Bytes (built once at boot).
  const labHtml = toLabHtml(readFileSync(join(dist, 'index.html'), 'utf8'))
  app.get(['/lab', '/lab/'], (_req, res) => res.set('Cache-Control', NO_CACHE).type('html').send(labHtml))
  app.get('{*path}', (_req, res, next) => {
    if (_req.path.startsWith('/api')) return next()
    res.set('Cache-Control', NO_CACHE)
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

export default app