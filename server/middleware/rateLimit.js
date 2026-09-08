// Dependency-free in-memory login rate limiter, keyed by client IP.
// On the free tier every redeploy resets the buckets; that is acceptable —
// the limiter is a speed bump against brute force, not a firewall.

function positiveInt(value, fallback) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

const MAX_ATTEMPTS = positiveInt(process.env.LOGIN_RATE_LIMIT, 5)
const WINDOW_MS = positiveInt(process.env.LOGIN_RATE_WINDOW_MS, 15 * 60 * 1000)

const buckets = new Map() // ip -> { count, resetAt }

function clientKey(req) {
  const raw = req?.ip || req?.socket?.remoteAddress || 'unknown'
  return raw.replace(/^::ffff:/, '')
}

export function loginLimiter(req, res, next) {
  const key = clientKey(req)
  const now = Date.now()

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k)
    }
  }

  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS }
    buckets.set(key, bucket)
  }
  bucket.count += 1

  if (bucket.count > MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
    res.set('Retry-After', String(retryAfter))
    return res.status(429).json({ error: 'Too many login attempts. Try again later.' })
  }

  next()
}

// Called after a successful login so a legit user is never locked out.
export function resetLoginBucket(req) {
  buckets.delete(clientKey(req))
}