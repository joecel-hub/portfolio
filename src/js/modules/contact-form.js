const API_BASE = import.meta.env?.VITE_API_BASE || '/api'
const FALLBACK_EMAIL = 'joecelpergis@gmail.com'

// Writes a status message into the form's aria-live note. On failure the
// note also offers a direct mailto link so the visitor is never stuck.
function setNote(note, state, text) {
  if (!note) return
  note.textContent = text
  note.dataset.state = state
  if (state === 'error') {
    note.append(' ')
    const a = document.createElement('a')
    a.href = `mailto:${FALLBACK_EMAIL}`
    a.textContent = FALLBACK_EMAIL
    note.append(a)
  }
}

function errorText(status, data) {
  if (status === 429) return 'Too many messages from your connection — please wait a bit, or email me directly at'
  if (status === 400 && data?.error) return `${data.error}. You can also email me directly at`
  return "Couldn't send your message right now — please email me directly at"
}

export function initContactForms() {
  document.querySelectorAll('.contact-form').forEach((form) => {
    const note = form.querySelector('.form-note')
    const button = form.querySelector('.form-submit')
    const idleLabel = button?.textContent || 'Send Message →'

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (button?.disabled) return

      const field = (n) => form.querySelector(`[name="${n}"]`)?.value.trim() || ''
      const payload = {
        name: field('name'),
        email: field('email'),
        subject: field('subject'),
        message: field('message'),
        website: field('website'), // honeypot — real visitors leave it empty
      }

      if (button) {
        button.disabled = true
        button.textContent = 'Sending…'
      }
      form.setAttribute('aria-busy', 'true')
      setNote(note, 'pending', 'Sending your message…')

      try {
        const res = await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        let data = null
        try { data = await res.json() } catch { /* non-JSON (e.g. static host 404) */ }
        if (res.ok) {
          form.reset()
          setNote(note, 'success', "Thanks — your message was sent. I'll get back to you soon.")
        } else {
          setNote(note, 'error', errorText(res.status, data))
        }
      } catch {
        setNote(note, 'error', errorText(0))
      } finally {
        if (button) {
          button.disabled = false
          button.textContent = idleLabel
        }
        form.removeAttribute('aria-busy')
      }
    })
  })
}
