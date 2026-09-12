import { Router } from 'express'
import { join, basename } from 'node:path'
import { unlink } from 'node:fs'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { upload, uploadVideo, UPLOAD_DIR } from '../middleware/upload.js'
import { schedulePushback } from '../pushback.js'

const router = Router()

const CATEGORIES = new Set(['gaming', 'editing', 'modeling', 'music', 'choreography'])

function toPublic(r) {
  return {
    id: r.id,
    category: r.category,
    title: r.title || '',
    description: r.description || '',
    videoUrl: r.video_url || '',
    thumbnail: r.thumbnail || '',
    sort: r.sort,
    enabled: r.enabled,
  }
}

function removeFile(p) {
  if (!p || !p.startsWith('/uploads/')) return // never unlink external (YouTube/Vimeo) URLs
  const name = basename(p)
  if (!name) return
  unlink(join(UPLOAD_DIR, name), () => {}) // best-effort
}

function isClear(v) {
  return v === '1' || v === true
}

// Public: enabled clips (for portfolio)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM hobby_clips WHERE enabled = 1 ORDER BY sort ASC').all()
  res.json(rows.map(toPublic))
})

router.use(requireAuth)

router.get('/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM hobby_clips ORDER BY sort ASC').all()
  res.json(rows.map(toPublic))
})

router.post('/', (req, res) => {
  const { category, title, description, videoUrl, sort } = req.body || {}
  if (!category || !CATEGORIES.has(category)) {
    return res
      .status(400)
      .json({ error: 'category must be one of: ' + [...CATEGORIES].join(', ') })
  }
  const info = db.prepare(
    'INSERT INTO hobby_clips (category, title, description, video_url, sort, enabled) VALUES (?, ?, ?, ?, ?, 1)',
  ).run(category, title || '', description || '', videoUrl || '', Number(sort) || 0)
  const row = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(info.lastInsertRowid)
  schedulePushback()
  res.status(201).json(toPublic(row))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { category, title, description, videoUrl, sort, enabled } = req.body || {}
  if (category !== undefined && !CATEGORIES.has(category)) {
    return res.status(400).json({ error: 'category must be one of: ' + [...CATEGORIES].join(', ') })
  }
  const s = Number(sort)
  db.prepare(
    `UPDATE hobby_clips SET category = ?, title = ?, description = ?, video_url = ?, sort = ?, enabled = ? WHERE id = ?`,
  ).run(
    category === undefined ? existing.category : category,
    title === undefined ? existing.title : String(title || ''),
    description === undefined ? existing.description : String(description || ''),
    videoUrl === undefined ? existing.video_url : String(videoUrl || ''),
    sort === undefined || sort === null || Number.isNaN(s) ? existing.sort : s,
    enabled === undefined ? existing.enabled : enabled ? 1 : 0,
    req.params.id,
  )
  const row = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(req.params.id)
  schedulePushback()
  res.json(toPublic(row))
})

// Upload a self-hosted video file; sets video_url to the resulting /uploads path.
router.put('/:id/video', uploadVideo.single('video'), (req, res) => {
  const existing = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(req.params.id)
  if (!existing) {
    if (req.file) removeFile(`/uploads/${req.file.filename}`)
    return res.status(404).json({ error: 'Not found' })
  }
  if (!req.file) return res.status(400).json({ error: 'No video file uploaded' })
  const videoUrl = `/uploads/${req.file.filename}`
  db.prepare('UPDATE hobby_clips SET video_url = ? WHERE id = ?').run(videoUrl, req.params.id)
  removeFile(existing.video_url)
  const row = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(req.params.id)
  schedulePushback()
  res.json(toPublic(row))
})

// Upload/replace a thumbnail image; pass clearThumbnail=1 to remove it instead.
router.put('/:id/thumbnail', upload.single('thumbnail'), (req, res) => {
  const existing = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(req.params.id)
  if (!existing) {
    if (req.file) removeFile(`/uploads/${req.file.filename}`)
    return res.status(404).json({ error: 'Not found' })
  }
  const newThumb = req.file ? `/uploads/${req.file.filename}` : null
  const thumbnail = newThumb || (isClear(req.body?.clearThumbnail) ? '' : existing.thumbnail)
  db.prepare('UPDATE hobby_clips SET thumbnail = ? WHERE id = ?').run(thumbnail, req.params.id)
  if (newThumb) removeFile(existing.thumbnail)
  else if (isClear(req.body?.clearThumbnail)) removeFile(existing.thumbnail)
  const row = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(req.params.id)
  schedulePushback()
  res.json(toPublic(row))
})

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM hobby_clips WHERE id = ?').get(req.params.id)
  if (row) {
    removeFile(row.video_url)
    removeFile(row.thumbnail)
  }
  db.prepare('DELETE FROM hobby_clips WHERE id = ?').run(req.params.id)
  schedulePushback()
  res.json({ ok: true })
})

export default router
