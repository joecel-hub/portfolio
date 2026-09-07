import { Router } from 'express'
import { login } from '../auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const token = login(username, password)
  if (!token) return res.status(401).json({ error: 'Invalid credentials' })
  res.json({ token })
})

export default router
