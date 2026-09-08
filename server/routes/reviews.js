import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { schedulePushback } from '../pushback.js'

const router = Router()

function serialize(row) {
  return { id: row.id, project: row.project, name: row.name, role: row.role, quote: row.quote, stars: row.stars, status: row.status, created_at: row.created_at }
}

// Public: client submits a review -> saved as pending (approval gate)
router.post('/', (req, res) => {
  const { project, name, role, quote, stars } = req.body || {}
  if (!name || !quote) return res.status(400).json({ error: 'name and quote are required' })
  if (!quote.trim() || quote.trim().length < 3) return res.status(400).json({ error: 'quote must be at least 3 characters' })
  const info = db.prepare("INSERT INTO reviews (project, name, role, quote, stars, status) VALUES (?, ?, ?, ?, ?, 'pending')")
    .run(String(project || '').slice(0, 120), name.slice(0, 120), String(role || '').slice(0, 160), quote.slice(0, 2000), Math.min(5, Math.max(1, Number(stars) || 5)))
  schedulePushback()
  res.status(201).json({ ok: true, id: info.lastInsertRowid, status: 'pending' })
})

// Authed: admin review inbox (all, incl pending) + approve / delete
router.use(requireAuth)

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all()
  res.json(rows.map(serialize))
})

router.post('/:id/approve', (req, res) => {
  const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare("UPDATE reviews SET status = 'approved' WHERE id = ?").run(req.params.id)
  // Move approved review into testimonials so it appears on the live portfolio
  db.prepare("INSERT INTO testimonials (name, role, quote, stars, status) VALUES (?, ?, ?, ?, 'approved')")
    .run(existing.name, existing.role, existing.quote, existing.stars)
  schedulePushback()
  res.json({ ok: true, status: 'approved' })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id)
  schedulePushback()
  res.json({ ok: true })
})

export default router
