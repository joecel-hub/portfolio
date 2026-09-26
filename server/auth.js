import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const JWT_SECRET = process.env.JWT_SECRET || ''

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || ''

// No built-in credentials, in any environment: an admin panel must never be
// reachable with a well-known default. Production additionally rejects the
// placeholder values from server/.env.example and the old dev defaults.
const PLACEHOLDERS = new Set([
  'admin123',
  'dev-secret-change-me',
  'replace-with-a-strong-password',
  'replace-with-a-long-random-string',
])
{
  const isProd = process.env.NODE_ENV === 'production'
  const bad = (v) => !v || (isProd && PLACEHOLDERS.has(v))
  const missing = []
  if (bad(ADMIN_PASS)) missing.push('ADMIN_PASS')
  if (bad(JWT_SECRET)) missing.push('JWT_SECRET')
  if (missing.length) {
    throw new Error(`Refusing to start: set a real ${missing.join(' and ')} in server/.env (see server/.env.example).`)
  }
}
const ADMIN_PASS_HASH = bcrypt.hashSync(ADMIN_PASS, 10)

export function login(username, password) {
  if (username !== ADMIN_USER) return false
  if (!bcrypt.compareSync(password, ADMIN_PASS_HASH)) return false
  return jwt.sign({ sub: username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
