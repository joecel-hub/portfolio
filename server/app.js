import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { seedIfEmpty } from './db.js'
import { UPLOAD_DIR } from './middleware/upload.js'

import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import testimonialRoutes from './routes/testimonials.js'
import logoRoutes from './routes/logos.js'
import reviewRoutes from './routes/reviews.js'
import certificateRoutes from './routes/certificates.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

seedIfEmpty()

export const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Temporary diagnostic — remove after debugging
import { isEnabled, REPO_ROOT } from './pushback.js'
import { execSync } from 'node:child_process'
import { statSync } from 'node:fs'
app.get('/api/diagnose', (_req, res) => {
  const patLen = (process.env.GIT_PAT || '').length
  const gitDir = join(REPO_ROOT, '.git')
  let gitAvail = false
  try { execSync('git --version', { encoding: 'utf8', timeout: 3000 }); gitAvail = true } catch {}
  let remoteUrl = ''
  try { remoteUrl = execSync('git remote -v', { encoding: 'utf8', timeout: 3000, cwd: REPO_ROOT }).trim() } catch {}
  let lastCommit = ''
  try { lastCommit = execSync('git log --oneline -1', { encoding: 'utf8', timeout: 3000, cwd: REPO_ROOT }).trim() } catch {}
  res.json({
    pushbackEnabled: isEnabled(),
    gitPatLength: patLen,
    repoRootExists: existsSync(REPO_ROOT),
    repoRootIsDir: existsSync(REPO_ROOT) ? statSync(REPO_ROOT).isDirectory() : false,
    gitDirExists: existsSync(gitDir),
    gitAvail,
    remoteUrl,
    lastCommit,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
  })
})

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

export default app