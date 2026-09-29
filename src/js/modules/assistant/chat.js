import { prefersReducedMotion } from '../../utils/motion.js'

// "Chat with Gio": a compact chat panel (a bottom sheet on phones) that asks
// /api/chat about Gio. Loaded on first open. Everything is rendered with
// textContent. While waiting, the visible robot looks "thinking"; while the
// reply appears, "talking". If the assistant isn't available (no key, busy,
// rate limited) the visitor gets the contact details instead.

const GREETING = "Hi! I'm Gio's assistant. Ask me about Gio's skills, experience, projects, or how to get in touch."
const SUGGESTIONS = [
  'What does Gio do?',
  "What's Gio's experience?",
  'Which projects has Gio built?',
  'What technologies does Gio use?',
  'What is Stryg.Bytes?',
  'How can I contact Gio?'
]
const MAX_CHARS = 1000
const MAX_TURNS = 12 // the server's limit, visitor turns and replies together
const UNAVAILABLE = "The assistant isn't available right now. You can email Gio at joecelpergis@gmail.com or use the contact form."

export function createChat({ getRobot = () => null, onOpenChange = () => {}, goToContact = () => {} } = {}) {
  const panel = document.createElement('div')
  panel.className = 'sb-chat'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-labelledby', 'sb-chat-title')
  panel.setAttribute('aria-describedby', 'sb-chat-note')
  panel.hidden = true
  panel.innerHTML = `
    <div class="sb-chat-head">
      <span class="sb-chat-mark" aria-hidden="true"></span>
      <div class="sb-chat-titles">
        <h2 class="sb-chat-title" id="sb-chat-title">Chat with Gio</h2>
        <p class="sb-chat-note" id="sb-chat-note">AI assistant — answers come from Gio's portfolio content.</p>
      </div>
      <button type="button" class="sb-chat-close" aria-label="Close chat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="sb-chat-log" role="log" aria-live="polite" aria-relevant="additions"></div>
    <div class="sb-chat-suggest" role="group" aria-label="Suggested questions"></div>
    <form class="sb-chat-form">
      <label class="sr-only" for="sb-chat-input">Your question</label>
      <textarea id="sb-chat-input" class="sb-chat-input" rows="1" maxlength="${MAX_CHARS}" placeholder="Ask about Gio…" autocomplete="off"></textarea>
      <button type="submit" class="sb-chat-send" aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </form>`
  document.body.appendChild(panel)

  const log = panel.querySelector('.sb-chat-log')
  const suggest = panel.querySelector('.sb-chat-suggest')
  const form = panel.querySelector('.sb-chat-form')
  const input = panel.querySelector('.sb-chat-input')
  const send = panel.querySelector('.sb-chat-send')
  const closeBtn = panel.querySelector('.sb-chat-close')

  const history = [] // [{role, content}] as sent to the server
  let busy = false
  let opener = null
  let revealTimer = 0

  function addMessage(role, text) {
    const el = document.createElement('p')
    el.className = `sb-msg sb-msg--${role}`
    el.textContent = text
    log.appendChild(el)
    log.scrollTop = log.scrollHeight
    return el
  }

  addMessage('bot', GREETING)
  SUGGESTIONS.forEach(s => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'sb-chip'
    b.textContent = s
    b.addEventListener('click', () => ask(s))
    suggest.appendChild(b)
  })

  function setMood(mood) {
    try { getRobot()?.setMood(mood) } catch { /* robot not ready */ }
  }

  // Shows the reply a few words at a time (at once with reduced motion)
  // while the robot "talks".
  function reveal(el, text) {
    return new Promise((resolve) => {
      if (prefersReducedMotion) { el.textContent = text; resolve(); return }
      const words = text.split(/(\s+)/)
      let i = 0
      setMood('talking')
      const step = () => {
        i = Math.min(words.length, i + 3)
        el.textContent = words.slice(0, i).join('')
        log.scrollTop = log.scrollHeight
        if (i < words.length) revealTimer = setTimeout(step, 40)
        else { setMood(null); resolve() }
      }
      step()
    })
  }

  function unavailable(el) {
    el.textContent = UNAVAILABLE + ' '
    const a = document.createElement('a')
    a.href = '#contact'
    a.textContent = 'Go to the contact form'
    a.addEventListener('click', (e) => { e.preventDefault(); close(); goToContact() })
    el.appendChild(a)
    el.classList.add('sb-msg--note')
  }

  async function ask(raw) {
    const text = String(raw ?? '').trim().slice(0, MAX_CHARS)
    if (!text || busy) return
    busy = true
    send.disabled = true
    suggest.hidden = true
    input.value = ''
    autosize()
    addMessage('user', text)
    history.push({ role: 'user', content: text })
    // Keep within the server's limit by dropping the oldest exchanges.
    while (history.length > MAX_TURNS - 1) history.splice(0, 2)

    const pending = addMessage('bot', '')
    pending.classList.add('is-typing')
    pending.setAttribute('aria-label', 'Thinking')
    setMood('thinking')

    let reply = null
    let failure = null
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.reply) reply = String(data.reply)
      else failure = res.status
    } catch {
      failure = 0
    }
    pending.classList.remove('is-typing')
    pending.removeAttribute('aria-label')
    setMood(null)

    if (reply) {
      history.push({ role: 'assistant', content: reply })
      await reveal(pending, reply)
    } else {
      history.pop() // unanswered: don't send it again as context
      if (failure === 400) pending.textContent = 'Please keep questions under 1000 characters.'
      else unavailable(pending)
    }
    busy = false
    send.disabled = false
    if (!panel.hidden) input.focus({ preventScroll: true })
  }

  function autosize() {
    input.style.height = 'auto'
    input.style.height = Math.min(input.scrollHeight, 120) + 'px'
    input.style.overflowY = input.scrollHeight > 120 ? 'auto' : 'hidden'
  }
  input.addEventListener('input', autosize)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value) }
  })
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value) })
  closeBtn.addEventListener('click', () => close())
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close() } })

  // `trigger`: the control that opened the chat, where focus returns on close
  // (buttons aren't always focused by a click, e.g. in Safari).
  function open(trigger) {
    if (!panel.hidden) { input.focus({ preventScroll: true }); return }
    opener = trigger || document.activeElement
    panel.hidden = false
    requestAnimationFrame(() => panel.classList.add('is-open'))
    onOpenChange(true)
    input.focus({ preventScroll: true })
  }
  function close() {
    if (panel.hidden) return
    clearTimeout(revealTimer)
    setMood(null)
    panel.classList.remove('is-open')
    panel.hidden = true
    onOpenChange(false)
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true })
    opener = null
  }

  return { open, close, isOpen: () => !panel.hidden }
}
