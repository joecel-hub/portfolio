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
    // A blocked port (e.g. Render's free tier) should fail fast, not leave
    // the visitor waiting for the OS-level TCP timeout.
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
  }
}

// Resend: an HTTPS email API (port 443), for hosts that block SMTP ports.
// Without a verified domain it only delivers to the account's own address,
// which is exactly the contact-form recipient.
const SEND_TIMEOUT_MS = 10_000
function resendConfig() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return { key, from: process.env.RESEND_FROM || 'Portfolio <onboarding@resend.dev>' }
}

async function sendViaResend(cfg, { to, replyTo, subject, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: cfg.from, to: [to], reply_to: replyTo, subject, text }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
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

  // Resend first (works on hosts that block SMTP), then SMTP, else not set up.
  const resend = resendConfig()
  const smtp = resend ? null : smtpConfig()
  if (!resend && !smtp) return res.status(503).json({ error: 'not_configured' })

  const to = process.env.CONTACT_TO || 'joecelpergis@gmail.com'
  const mail = { subject: `[Portfolio] ${subject}`, text: `${message}\n\n— ${name} <${email}>` }
  try {
    if (resend) {
      await sendViaResend(resend, { to, replyTo: email, ...mail })
    } else {
      const from = process.env.CONTACT_FROM || process.env.SMTP_USER
      await getTransporter(smtp).sendMail({
        from: `"Portfolio contact" <${from}>`,
        to,
        replyTo: { name, address: email },
        ...mail,
      })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('contact: sendMail failed:', err?.message || err)
    res.status(502).json({ error: 'send_failed' })
  }
})

export default router
