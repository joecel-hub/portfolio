import gsap from 'gsap'
import './styles/style.css'
import { playLoader } from './js/modules/loader.js'
import { initModeToggle } from './js/modules/mode-toggle.js'
import { initNavigation } from './js/modules/navigation.js'
import { initAnimations } from './js/modules/animations.js'
import { initLenis } from './js/modules/lenis.js'
import { initTextReveal } from './js/modules/text-reveal.js'
import { initDevParticles } from './js/modules/dev-particles.js'
import { initTextType } from './js/modules/text-type.js'
import { initTextMorph } from './js/modules/text-morph.js'
import { setLenis } from './js/modules/navigation.js'
import { initProfile } from './js/modules/profile.js'
import { initApiContent } from './js/modules/api-content.js'
import { initContactForms } from './js/modules/contact-form.js'
import { prefersReducedMotion } from './js/utils/motion.js'

document.addEventListener('DOMContentLoaded', () => {

  // Normal (Gio) is the default front door. Boot into the light profile;
  // Dev (Stryg.Bytes) is reached via the loader transition.
  document.body.classList.add('normal-mode')

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
      color: '124, 110, 255',
      maxOpacity: 0.35,
      speed: 0.15,
      mouseRadius: 100,
      mouseStrength: 0.4
    })
    if (particles) particles.setPaused(true)
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
    heroBotLoading = import('./js/modules/hero-bot.js')
      .then(({ initHeroBot }) => {
        heroBot = initHeroBot(container)
        if (heroBot && isNormalMode()) heroBot.setPaused(true) // switched back meanwhile
      })
      .catch((e) => console.error('hero-bot init failed:', e))
      .finally(() => { heroBotLoading = null })
  }

  // Normal (Gio) is the default mode, so the profile stack mounts on boot
  // rather than behind a gate. The guards keep re-entry (switching back from
  // Dev) from double-mounting.
  let textType = null
  const typeContainer = document.getElementById('pf-role')

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

  function mountType() {
    if (typeContainer && !textType) {
      try {
        textType = initTextType(typeContainer, {
          // The hero title is fixed; the supporting line (IT Infrastructure |
          // Web Developer) is static text below it.
          words: ['IT Support Engineer'],
          loop: false,
          typingSpeed: 60,
          deletingSpeed: 30,
          pauseDuration: 2500,
          initialDelay: 1000
        })
      } catch (e) {
        console.error('typewriter init failed:', e)
      }
    }
  }

  function mountNormal() {
    mountPixel()
    mountType()
    try { initProfile() } catch (e) { console.error('profile init failed:', e) }
  }

  function unmountNormal() {
    if (textType) {
      textType.destroy()
      textType = null
    }
    if (unmountPixel) {
      unmountPixel()
      unmountPixel = null
    }
  }

  // Boot: the typewriter runs behind the Gio loader; the profile entrance
  // plays as the grid wipes away (in the loader onComplete). The WebGL
  // background waits until the page has loaded and the main thread is idle,
  // so it stays off the critical path.
  const whenIdle = (fn) => {
    const run = () => ('requestIdleCallback' in window
      ? requestIdleCallback(fn, { timeout: 2000 })
      : setTimeout(fn, 200))
    if (document.readyState === 'complete') run()
    else window.addEventListener('load', run, { once: true })
  }
  whenIdle(() => { if (isNormalMode()) mountPixel() })
  mountType()

  let toggleMode = () => {}
  try {
    ({ toggleMode } = initModeToggle(particles, {
      onToNormal: () => {
        if (heroBot) heroBot.setPaused(true)
        mountNormal()
      },
      onToDev: () => {
        if (heroBot) heroBot.setPaused(false)
        else ensureHeroBot()
        unmountNormal()
      }
    }))
  } catch (e) {
    console.error('mode-toggle init failed:', e)
  }

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

  // The nav logo always returns to the top of the current mode; the floating
  // circular mode-switch below handles switching identities.
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

  // Floating circular mode switch — spins and swaps identity on click.
  const modeSwitch = document.getElementById('mode-switch')
  if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
      if (!prefersReducedMotion) gsap.to(modeSwitch, { rotation: '+=360', duration: 0.6, ease: 'power2.inOut' })
      toggleMode()
      setTimeout(scrollToHero, 450)
    })
  }

  // Footer year, kept current automatically
  const footerYear = document.getElementById('footer-year')
  if (footerYear) footerYear.textContent = new Date().getFullYear()

  // Contact forms (Dev section + Gio profile): POST to /api/contact.
  try { initContactForms() } catch (e) { console.error('contact form init failed:', e) }

  try { initTextReveal() } catch (e) { console.error('text-reveal init failed:', e) }
  if (!prefersReducedMotion) try { initTextMorph() } catch (e) { console.error('text-morph init failed:', e) }
  try {
    playLoader({
      brand: 'Gio',
      onComplete: () => {
        initProfile()
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
    })
  } catch (e) {
    console.error('loader init failed:', e)
    initProfile()
  }
})
