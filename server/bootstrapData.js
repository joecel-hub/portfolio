// First boot on a fresh persistent disk (Render Starter: DB_FILE and
// UPLOAD_DIR under /data). The disk starts empty, so without this the server
// would seed default content instead of the real CMS data. Copy the snapshot
// committed in the repo (server/portfolio.db + server/public/uploads, kept
// current by git pushback on the free tier) onto the disk once. After that
// the disk is the source of truth and this is a no-op.
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_DB = join(__dirname, 'portfolio.db')
const SNAPSHOT_UPLOADS = join(__dirname, 'public', 'uploads')

export function bootstrapData({
  dbFile = process.env.DB_FILE,
  uploadDir = process.env.UPLOAD_DIR,
  snapshotDb = SNAPSHOT_DB,
  snapshotUploads = SNAPSHOT_UPLOADS,
} = {}) {
  const copied = { db: false, uploads: 0 }

  if (dbFile && resolve(dbFile) !== resolve(snapshotDb) && !existsSync(dbFile) && existsSync(snapshotDb)) {
    mkdirSync(dirname(dbFile), { recursive: true })
    copyFileSync(snapshotDb, dbFile)
    copied.db = true
  }

  if (uploadDir && resolve(uploadDir) !== resolve(snapshotUploads) && existsSync(snapshotUploads)) {
    mkdirSync(uploadDir, { recursive: true })
    if (readdirSync(uploadDir).length === 0) {
      for (const name of readdirSync(snapshotUploads)) {
        if (name.startsWith('.')) continue
        copyFileSync(join(snapshotUploads, name), join(uploadDir, name))
        copied.uploads++
      }
    }
  }

  if (copied.db || copied.uploads) {
    console.log(`[bootstrap] seeded disk from repo snapshot: db=${copied.db} uploads=${copied.uploads}`)
  }
  return copied
}
