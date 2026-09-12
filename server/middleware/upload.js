import multer from 'multer'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { mkdirSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, '..', 'public', 'uploads')

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

// Separate config for short self-hosted video clips (hobby showcase). Kept apart
// from the image/PDF uploader above so image validation never gets loosened.
const ALLOWED_VIDEO = new Set(['.mp4', '.webm', '.mov'])
const MAX_VIDEO_SIZE = 60 * 1024 * 1024 // 60MB — a short clip, not a full recording

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, _file, cb) => {
    const ext = extname(_file.originalname).toLowerCase()
    const base = (req.body?.title || 'clip')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
    cb(null, `${Date.now()}-${base}${ext}`)
  },
})

const videoFileFilter = (_req, file, cb) => {
  const ext = extname(file.originalname).toLowerCase()
  if (ALLOWED_VIDEO.has(ext) && file.mimetype.startsWith('video/')) return cb(null, true)
  cb(new Error('Only MP4, WEBM or MOV video files are allowed'))
}

export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
})