// Dependency-free in-memory rate limiters, keyed by client IP.
// On the free tier every redeploy resets the buckets; that is acceptable —
// the limiters are speed bumps against brute force and spam, not a firewall.

function positiveInt(value, fallback) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

function clientKey(req) {
  const raw = req?.ip || req?.socket?.remoteAddress || 'unknown'
  return raw.replace(/^::ffff:/, '')
}

// Builds an Express middleware allowing `limit` requests per `windowMs` per IP.
// The returned middleware also exposes `.reset(req)` to clear that IP's bucket.
export function createRateLimiter({ limit, windowMs, message = 'Too many requests. Try again later.' }) {
  const buckets = new Map() // ip -> { count, resetAt }

  function limiter(req, res, next) {
    const key = clientKey(req)
    const now = Date.now()

    if (buckets.size > 5000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k)
      }
    }

    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }
    bucket.count += 1

    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      res.set('Retry-After', String(retryAfter))
      return res.status(429).json({ error: message })
    }

    next()
  }

  limiter.reset = (req) => buckets.delete(clientKey(req))
  return limiter
}

export const loginLimiter = createRateLimiter({
  limit: positiveInt(process.env.LOGIN_RATE_LIMIT, 5),
  windowMs: positiveInt(process.env.LOGIN_RATE_WINDOW_MS, 15 * 60 * 1000),
  message: 'Too many login attempts. Try again later.',
})

// Called after a successful login so a legit user is never locked out.
export function resetLoginBucket(req) {
  loginLimiter.reset(req)
}

// Public form endpoints (review submissions, contact messages). Each form has
// its own buckets so one doesn't eat into the other's allowance.
function formLimiter() {
  return createRateLimiter({
    limit: positiveInt(process.env.FORM_RATE_LIMIT, 5),
    windowMs: positiveInt(process.env.FORM_RATE_WINDOW_MS, 15 * 60 * 1000),
    message: 'Too many submissions. Please try again later.',
  })
}

export const reviewLimiter = formLimiter()
export const contactLimiter = formLimiter()
