import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'

const router = Router()

function serialize(row) {
  return { id: row.id, name: row.name, role: row.role, quote: row.quote, stars: row.stars, status: row.status, created_at: row.created_at }
}

// Public: approved testimonials only (for portfolio)
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT * FROM testimonials WHERE status = 'approved' ORDER BY created_at DESC").all()
  res.json(rows.map(serialize))
})

// Authed CRUD (admin dashboard manages this table)
router.use(requireAuth)

router.post('/', (req, res) => {
  const { name, role, quote, stars } = req.body || {}
  if (!name || !quote) return res.status(400).json({ error: 'name and quote are required' })
  const info = db.prepare("INSERT INTO testimonials (name, role, quote, stars, status) VALUES (?, ?, ?, ?, 'approved')")
    .run(name, role || '', quote, Number(stars) || 5)
  const row = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json(serialize(row))
})

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { name, role, quote, stars, status } = req.body || {}
  db.prepare('UPDATE testimonials SET name = ?, role = ?, quote = ?, stars = ?, status = ? WHERE id = ?')
    .run(name ?? existing.name, role ?? existing.role, quote ?? existing.quote, Number(stars) ?? existing.stars, status ?? existing.status, req.params.id)
  const row = db.prepare('SELECT * FROM testimonials WHERE id = ?').get(req.params.id)
  res.json(serialize(row))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
