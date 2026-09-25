import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'

// The fallbacks above are for local development only. In production, refuse
// to start rather than expose an admin panel guarded by well-known defaults.
const PLACEHOLDERS = new Set([
  'admin123',
  'dev-secret-change-me',
  'replace-with-a-strong-password',
  'replace-with-a-long-random-string',
])
if (process.env.NODE_ENV === 'production') {
  const missing = []
  if (!process.env.ADMIN_PASS || PLACEHOLDERS.has(ADMIN_PASS)) missing.push('ADMIN_PASS')
  if (!process.env.JWT_SECRET || PLACEHOLDERS.has(JWT_SECRET)) missing.push('JWT_SECRET')
  if (missing.length) {
    throw new Error(`Refusing to start in production: set a real ${missing.join(' and ')} (see server/.env.example).`)
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
