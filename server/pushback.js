import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { db } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = join(__dirname, '..')

const GIT_PAT = process.env.GIT_PAT || ''
const REMOTE = process.env.GIT_CMS_REMOTE || 'github.com/joecel-hub/portfolio'
const BRANCH = process.env.GIT_CMS_BRANCH || 'main'
// Coalescing window: quick bursts of edits collapse into one snapshot push
// (and therefore one auto-deploy). Tune via PERSIST_DEBOUNCE_MS.
const DEBOUNCE_MS = positiveInt(process.env.PERSIST_DEBOUNCE_MS, 8000)

function positiveInt(value, fallback) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

const PUSH_URL = `https://x-access-token:${GIT_PAT}@${REMOTE}.git`
const TRACKED_PATHS = ['server/portfolio.db', 'server/public/uploads']

let timer = null
let busy = false
let pending = false
let lastRun = 0

export function isEnabled() {
  return Boolean(GIT_PAT)
}

function log(msg) {
  console.log(`[pushback] ${msg}`)
}

function git(args, sync = false) {
  const base = ['-c', 'user.name=Gio Portfolio Bot', '-c', 'user.email=portfolio@strygbytes.local', '-C', REPO_ROOT]
  if (sync) {
    const r = spawnSync('git', [...base, ...args], { encoding: 'utf8', timeout: 15000 })
    return { code: r.status ?? 1, out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), failed: r.error?.message || '' }
  }
  return new Promise((resolve) => {
    const child = spawn('git', [...base, ...args], { cwd: REPO_ROOT })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    child.on('error', (e) => resolve({ code: 1, out, err, failed: e.message }))
    child.on('close', (code) => resolve({ code: code ?? 1, out: out.trim(), err: err.trim(), failed: '' }))
  })
}

async function snapshot() {
  try {
    db.pragma('wal_checkpoint(TRUNCATE)')
  } catch (e) {
    log(`checkpoint failed: ${e.message}`)
  }

  const add = await git(['add', '--force', '--', ...TRACKED_PATHS])
  if (add.failed) return log(`git add error: ${add.failed}`)
  if (add.code !== 0) return log(`git add failed (${add.code}): ${add.err}`)

  const staged = await git(['diff', '--cached', '--name-only'])
  if (staged.code === 0 && !staged.out) return false

  const commit = await git(['commit', '-m', 'chore(persist): snapshot CMS data'])
  if (commit.code !== 0) {
    const skip = /nothing to commit|no changes added/i.test(commit.err)
    if (!skip) log(`git commit failed (${commit.code}): ${commit.err || commit.out}`)
    return !skip
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const push = await git(['push', '--atomic', PUSH_URL, `HEAD:refs/heads/${BRANCH}`])
    if (push.code === 0) {
      log('pushed snapshot to ' + REMOTE)
      return true
    }
    if (attempt === 3) {
      log(`git push failed after 3 attempts: ${push.err || push.out}`)
      return true
    }
    await new Promise((r) => setTimeout(r, 2000 + attempt * 1000))
  }
  return true
}

export async function pushbackNow() {
  if (!isEnabled()) return false
  if (busy) {
    pending = true
    return false
  }
  busy = true
  try {
    await snapshot()
  } catch (e) {
    log(`snapshot error: ${e.message}`)
  } finally {
    busy = false
    lastRun = Date.now()
    if (pending) {
      pending = false
      schedulePushback()
    }
  }
  return true
}

export function schedulePushback() {
  if (!isEnabled()) return
  clearTimeout(timer)
  timer = setTimeout(() => pushbackNow(), DEBOUNCE_MS)
}

// Best-effort synchronous flush, used on shutdown so a final edit is not lost.
export function flushSync() {
  if (!isEnabled()) return
  try {
    db.pragma('wal_checkpoint(TRUNCATE)')
  } catch (e) {
    log(`checkpoint failed: ${e.message}`)
  }
  const base = ['-c', 'user.name=Gio Portfolio Bot', '-c', 'user.email=portfolio@strygbytes.local', '-C', REPO_ROOT]
  spawnSync('git', [...base, 'add', '--force', '--', ...TRACKED_PATHS], { encoding: 'utf8', timeout: 10000 })
  const staged = spawnSync('git', [...base, 'diff', '--cached', '--name-only'], { encoding: 'utf8', timeout: 10000 })
  if ((staged.stdout || '').trim()) {
    spawnSync('git', [...base, 'commit', '-m', 'chore(persist): snapshot CMS data on shutdown'], { encoding: 'utf8', timeout: 10000 })
    spawnSync('git', [...base, 'push', '--atomic', PUSH_URL, `HEAD:refs/heads/${BRANCH}`], { encoding: 'utf8', timeout: 15000 })
  }
}