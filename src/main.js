import './styles/style.css'
import { playLoader } from './js/modules/loader.js'
import { initModeToggle, syncThemeColor } from './js/modules/mode-toggle.js'
import { modeFromPath, applyModeMeta } from './js/modules/mode-route.js'
import { initNavigation } from './js/modules/navigation.js'
import { initAnimations } from './js/modules/animations.js'
import { initLenis } from './js/modules/lenis.js'
import { initTextReveal } from './js/modules/text-reveal.js'
import { initDevParticles } from './js/modules/dev-particles.js'
import { initTextMorph } from './js/modules/text-morph.js'
import { setLenis } from './js/modules/navigation.js'
import { initProfile } from './js/modules/profile.js'
import { initApiContent } from './js/modules/api-content.js'
import { initContactForms } from './js/modules/contact-form.js'
import { prefersReducedMotion } from './js/utils/motion.js'
import { wantsIntro, markIntroSeen } from './js/modules/intro-gate.js'

document.addEventListener('DOMContentLoaded', () => {

  // `/` boots the Gio profile; `/lab` boots straight into Stryg.Bytes (the
  // shareable client link). The mode switch keeps the URL in sync after.
  const bootMode = modeFromPath(location.pathname)
  const bootLab = bootMode === 'lab'
  // index.html ships <body class="normal-mode"> (no flash on the default
  // Gio view), so the class is set both ways here, not just added.
  document.body.classList.toggle('normal-mode', !bootLab)
  applyModeMeta(bootMode)

  // Wire the navigation (hamburger open/close, scrollspy, nav-link mapping)
  // FIRST — before any optional mounts — so the menu always works even if
  // WebGL/particles fail on a device.
  initNavigation()

  // Hydrate the Dev-mode Projects, client-logo marquee, and Testimonials from
  // the CMS API when it's reachable. If the API is down, the hardcoded static
  // sections remain intact (graceful fallback). Started once here so the
  // fetches overlap the loader; animations wait on this same promise.
  let contentReady = Promise.resolve()
  try { contentReady = initApiContent() } catch (e) { console.error('api-content init failed:', e) }

  let particles = null
  try {
    particles = initDevParticles(document.getElementById('dev-particles-canvas'), {
      count: 50,
      color: '21, 151, 212',
      maxOpacity: 0.35,
      speed: 0.15,
      mouseRadius: 100,
      mouseStrength: 0.4
    })
    if (particles) particles.setPaused(!bootLab)
  } catch (e) {
    console.error('dev-particles init failed:', e)
  }

  // The 3D hero bot (Three.js) lives in the Dev hero, which is hidden on the
  // default Gio view — so it is only downloaded and created on first entry
  // into Dev mode, when its container is visible and can be measured.
  let heroBot = null
  let heroBotLoading = null
  const isNormalMode = () => document.body.classList.contains('normal-mode')

  function ensureHeroBot() {
    if (heroBot || heroBotLoading) return
    const container = document.getElementById('hero-bot')
    if (!container) return
    heroBotLoading = import('./js/modules/robot-cube.js')
      .then(({ initHeroBot }) => {
        heroBot = initHeroBot(container, { onIntroEnd: () => assistant?.introEnded() })
        if (heroBot && isNormalMode()) heroBot.setPaused(true) // switched back meanwhile
      })
      .catch((e) => console.error('hero-bot init failed:', e))
      .finally(() => { heroBotLoading = null })
  }

  // The lab assistant (speech bubbles, docked robot, section tour). Loaded
  // with the lab; it never shows on the Gio side.
  let assistant = null
  let assistantLoading = null
  function ensureAssistant() {
    if (assistant) return Promise.resolve(assistant)
    if (!assistantLoading) {
      assistantLoading = import('./js/modules/assistant/index.js')
        .then(({ initAssistant }) => {
          // "Get in touch" until the chat panel ships (openChat → #contact).
          assistant = initAssistant({ getHeroBot: () => heroBot, openChat, actionLabel: 'Get in touch' })
          return assistant
        })
        .catch((e) => { console.error('assistant init failed:', e); return null })
    }
    return assistantLoading
  }
  function enterLabAssistant() {
    ensureAssistant().then(a => { if (a && !isNormalMode()) a.enterLab() })
  }

  // "Chat with Gio" (hero button, assistant bubbles). Until the chat panel
  // exists, it takes the visitor to the contact section.
  function openChat() {
    const contact = document.getElementById('contact')
    if (!contact) return
    if (window.lenisInstance) window.lenisInstance.scrollTo(contact, { offset: -20, duration: 1.2 })
    else contact.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }
  document.querySelectorAll('[data-open-chat]').forEach(btn => btn.addEventListener('click', openChat))

  // Normal (Gio) is the default mode, so the profile stack mounts on boot
  // rather than behind a gate. The guards keep re-entry (switching back from
  // Dev) from double-mounting.
  let unmountPixel = null
  const pixelContainer = document.getElementById('pixel-blast-container')

  // PixelBlast pulls in React + Three.js (~1 MB), so it is loaded on demand
  // (after the page has booted) instead of being part of the entry bundle.
  // Visitors who asked for less motion or data, or are on a low-end CPU,
  // get a static CSS dot field instead and never download it.
  const connection = navigator.connection || {}
  const skipPixel = prefersReducedMotion ||
    connection.saveData === true ||
    (navigator.hardwareConcurrency || 4) <= 2
  if (skipPixel && pixelContainer) pixelContainer.classList.add('is-static')

  let pixelLoading = null
  function mountPixel() {
    if (skipPixel || !pixelContainer || unmountPixel || pixelLoading) return
    pixelLoading = import('./js/modules/mountPixelBlast.jsx')
      .then(({ mountPixelBlast }) => {
        // The visitor may have switched to Dev while this was downloading.
        if (!isNormalMode() || unmountPixel) return
        unmountPixel = mountPixelBlast(pixelContainer, {
          variant: 'square',
          pixelSize: 3.5,
          color: '#8b7eea',
          patternScale: 2,
          patternDensity: 0.55,
          speed: 0.25, // reduced motion never gets here (static CSS field instead)
          enableRipples: true,
          edgeFade: 0.55
        })
      })
      .catch((e) => console.error('PixelBlast mount failed:', e))
      .finally(() => { pixelLoading = null })
  }

  function mountNormal() {
    mountPixel()
    try { initProfile() } catch (e) { console.error('profile init failed:', e) }
  }

  function unmountNormal() {
    if (unmountPixel) {
      unmountPixel()
      unmountPixel = null
    }
  }

  // Boot: the profile entrance plays as the page is revealed (startSite).
  // The WebGL background waits until the page has loaded and the main
  // thread is idle, so it stays off the critical path.
  const whenIdle = (fn) => {
    const run = () => ('requestIdleCallback' in window
      ? requestIdleCallback(fn, { timeout: 2000 })
      : setTimeout(fn, 200))
    if (document.readyState === 'complete') run()
    else window.addEventListener('load', run, { once: true })
  }
  // The page is revealed by the loader or, on a first visit, the Gio intro;
  // the WebGL background waits for that so it never competes with the intro.
  let introDone
  const revealed = new Promise((resolve) => { introDone = resolve })
  whenIdle(() => revealed.then(() => { if (isNormalMode()) mountPixel() }))
  if (bootLab) {
    syncThemeColor(false)
    ensureHeroBot()
    enterLabAssistant()
  }

  let toggleMode = () => {}
  let currentMode = () => bootMode
  try {
    ({ toggleMode, currentMode } = initModeToggle(particles, {
      // Leaving the lab: the robot waves goodbye first.
      beforeToNormal: () => (assistant ? assistant.goodbye() : Promise.resolve()),
      onToNormal: () => {
        if (heroBot) heroBot.setPaused(true)
        assistant?.leaveLab()
        mountNormal()
      },
      onToDev: () => {
        // Returning: the robot drops in again once the loader clears.
        if (heroBot) { heroBot.setPaused(false); heroBot.replayIntro() }
        else ensureHeroBot()
        unmountNormal()
        enterLabAssistant()
      }
    }, bootMode))
  } catch (e) {
    console.error('mode-toggle init failed:', e)
  }

  // Header identity switch (G | S·B): pressed state follows the mode.
  const idOpts = document.querySelectorAll('.id-opt')
  function syncIdSwitch(mode) {
    idOpts.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)))
  }
  syncIdSwitch(bootMode)
  document.addEventListener('modechange', (e) => syncIdSwitch(e.detail.to))
  idOpts.forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.mode === currentMode()) return
    toggleMode()
    setTimeout(scrollToHero, 450)
  }))

  function scrollToHero() {
    // In normal mode the dev hero is hidden, so land on the profile cover.
    const id = document.body.classList.contains('normal-mode') ? 'profile' : 'hero'
    const el = document.getElementById(id)
    if (!el) return
    if (window.lenisInstance) {
      window.lenisInstance.scrollTo(el, { offset: 0, duration: 1.2 })
    } else {
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }

  // The nav logo always returns to the top of the current mode; the header
  // G | S·B switch handles switching identities.
  const navLogo = document.getElementById('nav-logo')
  if (navLogo) {
    navLogo.addEventListener('click', scrollToHero)
    navLogo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        scrollToHero()
      }
    })
  }

  document.querySelectorAll('.back-to-studio').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleMode()
      setTimeout(scrollToHero, 450)
    })
  })

  // Footer year, kept current automatically
  const footerYear = document.getElementById('footer-year')
  if (footerYear) footerYear.textContent = new Date().getFullYear()

  // Contact forms (Dev section + Gio profile): POST to /api/contact.
  try { initContactForms() } catch (e) { console.error('contact form init failed:', e) }

  try { initTextReveal() } catch (e) { console.error('text-reveal init failed:', e) }
  if (!prefersReducedMotion) try { initTextMorph() } catch (e) { console.error('text-morph init failed:', e) }
  // Runs once, as the page is revealed (after the loader, or the Gio intro).
  let started = false
  function startSite() {
    if (started) return
    started = true
    introDone()
    if (!bootLab) initProfile()
    // Native scrolling when the visitor asks for reduced motion.
    const lenis = prefersReducedMotion ? null : initLenis()
    window.lenisInstance = lenis
    setLenis(lenis)
    // Wait for CMS content before animations so ScrollTrigger picks up the
    // dynamically-rendered project cards / testimonials. Falls back to the
    // static sections when the API is unreachable.
    contentReady.finally(() => {
      try { initAnimations() } catch (e) { console.error('animations init failed:', e) }
    })
  }

  function bootLoader() {
    try {
      playLoader({ brand: bootLab ? 'Stryg.Bytes' : 'Gio', onComplete: startSite })
    } catch (e) {
      console.error('loader init failed:', e)
      if (!bootLab) initProfile()
    }
  }

  // First Gio visit of the session: the robot intro replaces the grid loader.
  // It gets a short window to download and prepare; if it isn't ready in
  // time (slow network) or fails (no WebGL), the normal loader plays and the
  // page is never held back. The page loader stays up underneath meanwhile.
  let storage = null
  try { storage = window.sessionStorage } catch { /* blocked */ }
  const playIntro = wantsIntro({
    mode: bootMode,
    storage,
    reduceMotion: prefersReducedMotion,
    saveData: connection.saveData === true,
    cores: navigator.hardwareConcurrency,
    webgl: 'WebGLRenderingContext' in window
  })
  if (playIntro) {
    const INTRO_BUDGET_MS = 1500
    const prep = import('./js/modules/gio-intro.js').then(m => m.prepareGioIntro())
    const late = new Promise((_, reject) => setTimeout(() => reject(new Error('intro not ready in time')), INTRO_BUDGET_MS))
    Promise.race([prep, late])
      .then((intro) => {
        markIntroSeen(storage)
        return intro.play({ onReveal: () => playLoader({ brand: 'Gio', instant: true, onComplete: startSite }) })
      })
      .catch((e) => {
        console.info('Gio intro skipped:', e?.message || e)
        prep.then(intro => intro.dispose(), () => {})
        bootLoader()
      })
  } else {
    bootLoader()
  }
})
