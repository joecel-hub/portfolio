import { Router } from 'express'
import { login } from '../auth.js'
import { loginLimiter, resetLoginBucket } from '../middleware/rateLimit.js'

const router = Router()

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {}
  const token = login(username, password)
  if (!token) return res.status(401).json({ error: 'Invalid credentials' })
  resetLoginBucket(req)
  res.json({ token })
})

export default router