import { Router } from 'express'
import nodemailer from 'nodemailer'
import { contactLimiter } from '../middleware/rateLimit.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Collapse to a single line so header fields can't smuggle extra headers.
function oneLine(v, max) {
  return String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max)
}

function smtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  const port = Number(SMTP_PORT) || 587
  return {
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  }
}

let transporter = null
function getTransporter(cfg) {
  if (!transporter) transporter = nodemailer.createTransport(cfg)
  return transporter
}

// Public: portfolio contact form -> email to the site owner.
router.post('/', contactLimiter, async (req, res) => {
  const body = req.body || {}

  // Honeypot: a hidden field real visitors never fill. Pretend success so
  // bots get no signal, but send nothing.
  if (String(body.website ?? '').trim()) return res.json({ ok: true })

  const name = oneLine(body.name, 120)
  const email = oneLine(body.email, 200)
  const subject = oneLine(body.subject, 160) || 'Portfolio inquiry'
  const message = String(body.message ?? '').trim().slice(0, 5000)

  if (!name) return res.status(400).json({ error: 'Please enter your name' })
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' })
  if (message.length < 5) return res.status(400).json({ error: 'Please write a slightly longer message' })

  const cfg = smtpConfig()
  if (!cfg) return res.status(503).json({ error: 'not_configured' })

  const to = process.env.CONTACT_TO || 'joecelpergis@gmail.com'
  const from = process.env.CONTACT_FROM || process.env.SMTP_USER
  try {
    await getTransporter(cfg).sendMail({
      from: `"Portfolio contact" <${from}>`,
      to,
      replyTo: { name, address: email },
      subject: `[Portfolio] ${subject}`,
      text: `${message}\n\n— ${name} <${email}>`,
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('contact: sendMail failed:', err?.message || err)
    res.status(502).json({ error: 'send_failed' })
  }
})

export default router
