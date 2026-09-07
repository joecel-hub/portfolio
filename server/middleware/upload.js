import multer from 'multer'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = join(__dirname, '..', 'public', 'uploads')

mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf'])
const MAX_SIZE = 20 * 1024 * 1024

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, _file, cb) => {
    const ext = extname(_file.originalname).toLowerCase()
    const base = (req.body?.name || 'logo')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
    cb(null, `${Date.now()}-${base}${ext}`)
  },
})

const fileFilter = (_req, file, cb) => {
  const ext = extname(file.originalname).toLowerCase()
  if (ext === '.pdf') {
    return file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Invalid PDF file'))
  }
  if (ALLOWED.has(ext) && file.mimetype.startsWith('image/')) return cb(null, true)
  cb(new Error('Only PNG, JPG, WEBP, GIF images or PDF files are allowed'))
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } })