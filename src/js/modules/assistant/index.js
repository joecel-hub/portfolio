import { prefersReducedMotion } from '../../utils/motion.js'

// The Stryg.Bytes assistant: the robot-cube as a quiet tour guide.
//
// - It speaks through a small bubble next to whichever robot is on screen:
//   the big one in the hero, or a docked copy (bottom-right) once the hero
//   has scrolled away. Text is also announced through one polite live region.
// - It says "Welcome to the Lab." after the drop-in, reacts when clicked, and
//   waves before the visitor switches back to Gio.
// - Tour: each section speaks at most once per visit, never within 8 s of the
//   last message, never right after switching, and never while chatting.
//
// Lab only: everything hides and stops when the visitor is on Gio.

const LINES = {
  welcome: 'Welcome to the Lab.',
  hello: 'Hey! Looking around?',
  about: 'Stryg.Bytes is where Gio builds, tests and improves ideas.',
  'skills-dev': 'These are the tools behind the projects in this lab.',
  projects: 'These are some of the systems and experiments Gio has built.',
  contact: 'Want to get in touch with Gio?'
}
const TOUR_SECTIONS = ['about', 'skills-dev', 'projects', 'contact']
const COOLDOWN_MS = 8000
const QUIET_AFTER_ENTER_MS = 1500

export function initAssistant({ getHeroBot, openChat }) {
  const reduceMotion = prefersReducedMotion
  const hero = document.getElementById('hero')
  const card = document.querySelector('.hero-bot-card')
  const hit = document.querySelector('.hero-bot-hit')

  // One polite live region for everything the assistant says.
  const live = document.createElement('div')
  live.className = 'sr-only'
  live.setAttribute('aria-live', 'polite')
  document.body.appendChild(live)

  const heroBubble = makeBubble('sb-bubble--hero', () => hit)
  card?.appendChild(heroBubble.el)

  const dock = document.createElement('div')
  dock.className = 'sb-dock'
  dock.innerHTML = `<button type="button" class="sb-dock-btn" aria-label="Say hi to Gio's assistant">
      <span class="sb-dock-stage" aria-hidden="true"></span>
    </button>`
  const dockBubble = makeBubble('sb-bubble--dock', () => dockBtn)
  dock.prepend(dockBubble.el)
  document.body.appendChild(dock)
  const dockStage = dock.querySelector('.sb-dock-stage')
  const dockBtn = dock.querySelector('.sb-dock-btn')

  let labActive = false
  let heroVisible = true
  let chatOpen = false
  let dockRobot = null
  let dockLoading = null
  let dockShown = false
  const spoken = new Set()
  let lastSpoke = -Infinity
  let quietUntil = 0
  let introWaiter = null

  // `anchor`: the robot button the bubble belongs to; focus returns there
  // when the chat it opened closes (the bubble itself hides).
  function makeBubble(mod, anchor) {
    const el = document.createElement('div')
    el.className = 'sb-bubble ' + mod
    el.innerHTML = '<p class="sb-bubble-text" aria-hidden="true"></p><button type="button" class="sb-bubble-action" hidden></button>'
    const text = el.querySelector('.sb-bubble-text')
    const action = el.querySelector('.sb-bubble-action')
    action.textContent = 'Chat with Gio'
    action.addEventListener('click', () => { hideBubbles(); openChat(anchor()) })
    let timer = 0
    return {
      el,
      show(msg, { withAction = false, ms = 4200 } = {}) {
        text.textContent = msg
        action.hidden = !withAction
        el.classList.add('is-shown')
        clearTimeout(timer)
        timer = setTimeout(() => el.classList.remove('is-shown'), withAction ? 8000 : ms)
      },
      hide() { clearTimeout(timer); el.classList.remove('is-shown') }
    }
  }
  function hideBubbles() { heroBubble.hide(); dockBubble.hide() }

  function say(msg, opts) {
    if (!labActive || chatOpen) return
    hideBubbles()
    ;(heroVisible ? heroBubble : dockBubble).show(msg, opts)
    live.textContent = ''
    requestAnimationFrame(() => { live.textContent = msg })
    lastSpoke = performance.now()
  }

  // ── Dock: appears when the hero leaves the screen (lab only) ──
  function syncDock() {
    const want = labActive && !heroVisible && document.body.classList.contains('loader-done')
    if (want === dockShown) return
    dockShown = want
    dock.classList.toggle('is-shown', want)
    if (!want) { dockBubble.hide(); dockRobot?.stop(); return }
    heroBubble.hide()
    ensureDockRobot().then(r => { if (dockShown && !document.hidden) r?.start() })
  }
  function ensureDockRobot() {
    if (dockRobot) return Promise.resolve(dockRobot)
    if (dockLoading) return dockLoading
    const webgl = 'WebGLRenderingContext' in window
    if (!webgl) { dockStage.classList.add('is-static'); return Promise.resolve(null) }
    dockLoading = import('./dock.js')
      .then(m => m.createDockRobot(dockStage, { reduceMotion }))
      .then(r => { dockRobot = r; return r })
      .catch(e => {
        console.warn('assistant: dock robot unavailable, using the static mark', e)
        dockStage.classList.add('is-static')
        return null
      })
      .finally(() => { dockLoading = null })
    return dockLoading
  }
  document.addEventListener('visibilitychange', () => {
    if (!dockRobot) return
    if (document.hidden || !dockShown) dockRobot.stop()
    else dockRobot.start()
  })

  const heroIO = hero && new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting && e.intersectionRatio >= 0.3
    syncDock()
  }, { threshold: [0, 0.3, 0.6] })
  heroIO?.observe(hero)

  // ── Section tour ──
  const tourIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= 0.4) tour(e.target)
    }
  }, { threshold: [0, 0.4] })
  TOUR_SECTIONS.forEach(id => { const s = document.getElementById(id); if (s) tourIO.observe(s) })

  function tour(section) {
    const id = section.id
    const now = performance.now()
    if (!labActive || heroVisible || chatOpen || spoken.has(id)) return
    if (now < quietUntil || now - lastSpoke < COOLDOWN_MS) return
    spoken.add(id)
    const r = section.getBoundingClientRect()
    const x = Math.min(window.innerWidth * 0.5, r.left + r.width / 2)
    const y = Math.max(0, Math.min(window.innerHeight * 0.45, r.top + Math.min(r.height, window.innerHeight) / 2))
    ensureDockRobot().then(robot => robot?.lookAtPoint(x, y, 2.5))
    say(LINES[id])
  }

  // ── A glance at the project card under the cursor (throttled) ──
  let lastGlance = 0
  document.getElementById('projects')?.addEventListener('pointerover', (e) => {
    const cardEl = e.target.closest?.('.project-card')
    const now = performance.now()
    if (!cardEl || !dockShown || !dockRobot || now - lastGlance < 250) return
    lastGlance = now
    const r = cardEl.getBoundingClientRect()
    dockRobot.lookAtPoint(r.left + r.width / 2, r.top + r.height / 2, 1.8)
  })

  // ── Saying hi ──
  function hello(robot) {
    robot?.react('happy')
    say(LINES.hello, { withAction: true })
  }
  hit?.addEventListener('click', () => hello(getHeroBot()))
  dockBtn.addEventListener('click', () => ensureDockRobot().then(hello))

  // ── Lifecycle, driven by main.js ──
  function waitForLoader() {
    if (document.body.classList.contains('loader-done')) return Promise.resolve()
    return new Promise((resolve) => {
      const mo = new MutationObserver(() => {
        if (document.body.classList.contains('loader-done')) { mo.disconnect(); resolve() }
      })
      mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    })
  }

  // Entering the lab (boot on /lab, or a switch from Gio).
  async function enterLab() {
    labActive = true
    quietUntil = performance.now() + QUIET_AFTER_ENTER_MS
    await waitForLoader()
    syncDock()
    if (!labActive) return
    // Speak once the robot has dropped in (or right away with no drop-in).
    const bot = getHeroBot()
    if (!reduceMotion && (!bot || bot.hasIntro())) {
      await new Promise((resolve) => {
        introWaiter = resolve
        setTimeout(resolve, 4000) // never wait on a robot that won't come
      })
      introWaiter = null
    }
    if (labActive && heroVisible) say(LINES.welcome)
  }
  // The hero robot finished its drop-in (robot-cube onIntroEnd).
  function introEnded() { introWaiter?.() }

  // Before switching to Gio: a short wave from whichever robot is visible.
  function goodbye() {
    if (!labActive || reduceMotion) return Promise.resolve()
    hideBubbles()
    const bot = heroVisible ? getHeroBot() : dockShown ? dockRobot : null
    if (!bot || (heroVisible && !bot.isShowing())) return Promise.resolve()
    bot.react('wave')
    return new Promise(resolve => setTimeout(resolve, 700))
  }

  function leaveLab() {
    labActive = false
    introWaiter?.()
    hideBubbles()
    syncDock()
  }

  function setChatOpen(open) {
    chatOpen = !!open
    if (chatOpen) hideBubbles()
    dock.classList.toggle('is-chatting', chatOpen)
  }

  // The robot currently in view, for chat moods (thinking/talking).
  const activeRobot = () => (heroVisible ? getHeroBot() : dockRobot)

  return { enterLab, leaveLab, goodbye, introEnded, setChatOpen, activeRobot }
}
