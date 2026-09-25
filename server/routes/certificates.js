import { Router } from 'express'
import { join, basename } from 'node:path'
import { unlink } from 'node:fs'
import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { upload, UPLOAD_DIR } from '../middleware/upload.js'
import { schedulePushback } from '../pushback.js'
import { firstUnsafe } from '../safeUrl.js'

const router = Router()

// certification = professional certification, training = course/workshop,
// event = attendance at an event or talk.
const KINDS = new Set(['certification', 'training', 'event'])

function cleanKind(v, fallback = 'training') {
  return KINDS.has(v) ? v : fallback
}

const FIELDS = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
])

function toPublic(r) {
  return {
    id: r.id,
    name: r.name,
    issuer: r.issuer || '',
    date: r.cert_date || '',
    kind: cleanKind(r.kind),
    credential: r.credential || '',
    image: r.image || '',
    pdf: r.pdf || '',
    link: r.link || '',
    sort: r.sort,
    enabled: r.enabled,
  }
}

function removeFile(p) {
  if (!p) return
  const name = basename(p)
  if (!name) return
  unlink(join(UPLOAD_DIR, name), () => {}) // best-effort
}

function isClear(v) {
  return v === '1' || v === true
}

// Public: enabled certificates (for portfolio)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM certificates WHERE enabled = 1 ORDER BY sort ASC').all()
  res.json(rows.map(toPublic))
})

router.use(requireAuth)

router.get('/all', (req, res) => {
  const rows = db.prepare('SELECT * FROM certificates ORDER BY sort ASC').all()
  res.json(rows.map(toPublic))
})

router.post('/', FIELDS, (req, res) => {
  const { name, issuer, cert_date, link, sort, kind, credential } = req.body || {}
  if (!name) {
    if (req.files?.image?.[0]) removeFile(`/uploads/${req.files.image[0].filename}`)
    if (req.files?.pdf?.[0]) removeFile(`/uploads/${req.files.pdf[0].filename}`)
    return res.status(400).json({ error: 'name is required' })
  }
  if (firstUnsafe({ link })) {
    if (req.files?.image?.[0]) removeFile(`/uploads/${req.files.image[0].filename}`)
    if (req.files?.pdf?.[0]) removeFile(`/uploads/${req.files.pdf[0].filename}`)
    return res.status(400).json({ error: 'link must be an http(s) URL or a /path' })
  }
  const image = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : ''
  const pdf = req.files?.pdf?.[0] ? `/uploads/${req.files.pdf[0].filename}` : ''
  const info = db.prepare(
    'INSERT INTO certificates (name, issuer, cert_date, image, pdf, link, sort, enabled, kind, credential) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
  ).run(String(name), issuer || '', cert_date || '', image, pdf, link || '', Number(sort) || 0, cleanKind(kind), String(credential || '').slice(0, 120))
  const row = db.prepare('SELECT * FROM certificates WHERE id = ?').get(info.lastInsertRowid)
  schedulePushback()
  res.status(201).json(toPublic(row))
})

router.put('/:id', FIELDS, (req, res) => {
  const existing = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id)
  if (!existing) {
    if (req.files?.image?.[0]) removeFile(`/uploads/${req.files.image[0].filename}`)
    if (req.files?.pdf?.[0]) removeFile(`/uploads/${req.files.pdf[0].filename}`)
    return res.status(404).json({ error: 'Not found' })
  }
  const { name, issuer, cert_date, link, sort, enabled, kind, credential } = req.body || {}
  if (firstUnsafe({ link })) {
    if (req.files?.image?.[0]) removeFile(`/uploads/${req.files.image[0].filename}`)
    if (req.files?.pdf?.[0]) removeFile(`/uploads/${req.files.pdf[0].filename}`)
    return res.status(400).json({ error: 'link must be an http(s) URL or a /path' })
  }
  const newImage = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null
  const newPdf = req.files?.pdf?.[0] ? `/uploads/${req.files.pdf[0].filename}` : null
  const image = newImage || (isClear(req.body?.clearImage) ? '' : existing.image)
  const pdf = newPdf || (isClear(req.body?.clearPdf) ? '' : existing.pdf)
  const s = Number(sort)
  db.prepare(
    `UPDATE certificates SET name = ?, issuer = ?, cert_date = ?, image = ?, pdf = ?, link = ?, sort = ?, enabled = ?, kind = ?, credential = ? WHERE id = ?`,
  ).run(
    name === undefined ? existing.name : String(name),
    issuer === undefined ? existing.issuer : String(issuer || ''),
    cert_date === undefined ? existing.cert_date : String(cert_date || ''),
    image,
    pdf,
    link === undefined ? existing.link : String(link || ''),
    sort === undefined || sort === null || Number.isNaN(s) ? existing.sort : s,
    enabled === undefined ? existing.enabled : enabled ? 1 : 0,
    kind === undefined ? cleanKind(existing.kind) : cleanKind(kind, cleanKind(existing.kind)),
    credential === undefined ? existing.credential || '' : String(credential || '').slice(0, 120),
    req.params.id,
  )
  if (newImage) removeFile(existing.image)
  else if (isClear(req.body?.clearImage)) removeFile(existing.image)
  if (newPdf) removeFile(existing.pdf)
  else if (isClear(req.body?.clearPdf)) removeFile(existing.pdf)
  const row = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id)
  schedulePushback()
  res.json(toPublic(row))
})

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id)
  if (row) {
    removeFile(row.image)
    removeFile(row.pdf)
  }
  db.prepare('DELETE FROM certificates WHERE id = ?').run(req.params.id)
  schedulePushback()
  res.json({ ok: true })
})

export default router