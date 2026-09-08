import { Router } from 'express'
import { join, basename } from 'node:path'
import { unlink } from 'node:fs'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { upload, UPLOAD_DIR } from '../middleware/upload.js'
import { schedulePushback } from '../pushback.js'

const router = Router()

const CATEGORIES = new Set(['client', 'saas', 'apps', 'template'])

function cleanCategory(v) {
  return CATEGORIES.has(v) ? v : 'client'
}

function removeImageFile(image) {
  if (!image) return
  const name = basename(image)
  if (!name) return
  unlink(join(UPLOAD_DIR, name), () => {}) // best-effort
}

function rowToProject(row) {
  if (!row) return null
  let tags = []
  try { tags = JSON.parse(row.tags || '[]') } catch {}
  return { id: row.id, name: row.name, desc: row.desc, tags, url: row.url, demoUrl: row.demo_url || '', thumb: row.thumb, category: cleanCategory(row.category), image: row.image || '', sort: row.sort }
}

// Public: list projects (for portfolio)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY sort ASC').all()
  res.json(rows.map(rowToProject))
})

// Authed CRUD
router.use(requireAuth)

router.post('/', (req, res) => {
  const { name, desc, tags, url, demoUrl, thumb, category, sort } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name is required' })
  const info = db.prepare('INSERT INTO projects (name, desc, tags, url, demo_url, thumb, category, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(name, desc || '', JSON.stringify(tags || []), url || '', demoUrl || '', thumb || 'wave', cleanCategory(category), Number(sort) || 0)
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(info.lastInsertRowid)
  schedulePushback()
  res.status(201).json(rowToProject(row))
})

router.put('/:id', (req, res) => {
  const { name, desc, tags, url, demoUrl, thumb, category, sort } = req.body || {}
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  let existingTags = []
  try { existingTags = JSON.parse(existing.tags || '[]') } catch {}
  const s = Number(sort)
  const nextSort = sort === undefined || sort === null || Number.isNaN(s) ? existing.sort : s
  db.prepare('UPDATE projects SET name = ?, desc = ?, tags = ?, url = ?, demo_url = ?, thumb = ?, category = ?, sort = ? WHERE id = ?')
    .run(name ?? existing.name, desc ?? existing.desc, JSON.stringify(tags ?? existingTags), url ?? existing.url, demoUrl ?? existing.demo_url, thumb ?? existing.thumb, cleanCategory(category ?? existing.category), nextSort, req.params.id)
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  schedulePushback()
  res.json(rowToProject(row))
})

// Replace or clear the project screenshot
router.put('/:id/image', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!existing) {
    if (req.file) removeImageFile(`/uploads/${req.file.filename}`)
    return res.status(404).json({ error: 'Not found' })
  }
  let image = existing.image
  let newImage = null
  if (req.file) {
    newImage = `/uploads/${req.file.filename}`
    image = newImage
  } else if (req.body?.clearImage === '1' || req.body?.clearImage === true) {
    image = ''
  }
  db.prepare('UPDATE projects SET image = ? WHERE id = ?').run(image, req.params.id)
  if (newImage) removeImageFile(existing.image)
  else if (image === '' && existing.image) removeImageFile(existing.image)
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  schedulePushback()
  res.json(rowToProject(row))
})

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  removeImageFile(existing.image)
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  schedulePushback()
  res.json({ ok: true })
})

export default router
