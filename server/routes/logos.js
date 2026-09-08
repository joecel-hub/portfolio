import { Router } from 'express'
import { join, basename } from 'node:path'
import { unlink } from 'node:fs'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { upload, UPLOAD_DIR } from '../middleware/upload.js'
import { schedulePushback } from '../pushback.js'

const router = Router()

function toPublic(r) {
  return { id: r.id, name: r.name, image: r.image || '', sort: r.sort, enabled: r.enabled }
}

function removeImageFile(image) {
  if (!image) return
  const name = basename(image)
  if (!name) return
  unlink(join(UPLOAD_DIR, name), () => {}) // best-effort
}

// Public: enabled logos (for portfolio marquee)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM client_logos WHERE enabled = 1 ORDER BY sort ASC').all()
  res.json(rows.map(toPublic))
})

router.use(requireAuth)

router.get('/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM client_logos ORDER BY sort ASC').all()
  res.json(rows.map(toPublic))
})

router.post('/', upload.single('image'), (req, res) => {
  const { name, sort } = req.body || {}
  if (!name) {
    if (req.file) removeImageFile(`/uploads/${req.file.filename}`)
    return res.status(400).json({ error: 'name is required' })
  }
  const image = req.file ? `/uploads/${req.file.filename}` : ''
  const info = db.prepare('INSERT INTO client_logos (name, image, sort, enabled) VALUES (?, ?, ?, 1)')
    .run(name, image, Number(sort) || 0)
  schedulePushback()
  res.status(201).json({ id: info.lastInsertRowid, name, image, sort: Number(sort) || 0, enabled: 1 })
})

router.put('/:id', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM client_logos WHERE id = ?').get(req.params.id)
  if (!existing) {
    if (req.file) removeImageFile(`/uploads/${req.file.filename}`)
    return res.status(404).json({ error: 'Not found' })
  }
  const { name, sort, enabled } = req.body || {}
  let image = existing.image
  let newImage = null
  if (req.file) {
    newImage = `/uploads/${req.file.filename}`
    image = newImage
  } else if (req.body?.clearImage === '1' || req.body?.clearImage === true) {
    image = ''
  }
  const s = Number(sort)
  const nextSort = sort === undefined || sort === null || Number.isNaN(s) ? existing.sort : s
  const nextName = name === undefined ? existing.name : String(name)
  const nextEnabled = enabled === undefined ? existing.enabled : enabled ? 1 : 0
  db.prepare('UPDATE client_logos SET name = ?, image = ?, sort = ?, enabled = ? WHERE id = ?')
    .run(nextName, image, nextSort, nextEnabled, req.params.id)
  if (newImage) removeImageFile(existing.image)
  else if (image === '' && existing.image) removeImageFile(existing.image)
  const row = db.prepare('SELECT * FROM client_logos WHERE id = ?').get(req.params.id)
  schedulePushback()
  res.json(toPublic(row))
})

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM client_logos WHERE id = ?').get(req.params.id)
  if (row) removeImageFile(row.image)
  db.prepare('DELETE FROM client_logos WHERE id = ?').run(req.params.id)
  schedulePushback()
  res.json({ ok: true })
})

export default router