import gsap from 'gsap'
import './styles/style.css'
import { playLoader } from './js/modules/loader.js'
import { initModeToggle } from './js/modules/mode-toggle.js'
import { initNavigation } from './js/modules/navigation.js'
import { initAnimations } from './js/modules/animations.js'
import { initHelpers } from './js/utils/helpers.js'
import { initLenis } from './js/modules/lenis.js'
import { initTextReveal } from './js/modules/text-reveal.js'
import { initDevParticles } from './js/modules/dev-particles.js'
import { initHeroBot } from './js/modules/hero-bot.js'
import { initTextType } from './js/modules/text-type.js'
import { initTextMorph } from './js/modules/text-morph.js'
import { setLenis } from './js/modules/navigation.js'
import { mountPixelBlast } from './js/modules/mountPixelBlast.jsx'
import { initProfile } from './js/modules/profile.js'
import { initApiContent } from './js/modules/api-content.js'

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
  // sections remain intact (graceful fallback).
  try { initApiContent() } catch (e) { console.error('api-content init failed:', e) }

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

  let heroBot = null
  try {
    heroBot = initHeroBot(document.getElementById('hero-bot'))
    if (heroBot) heroBot.setPaused(true)
  } catch (e) {
    console.error('hero-bot init failed:', e)
  }

  // Normal (Gio) is the default mode, so the profile stack mounts on boot
  // rather than behind a gate. The guards keep re-entry (switching back from
  // Dev) from double-mounting.
  let textType = null
  const typeContainer = document.getElementById('pf-role')

  let unmountPixel = null
  const pixelContainer = document.getElementById('pixel-blast-container')

  function mountPixel() {
    if (pixelContainer && !unmountPixel) {
      try {
        unmountPixel = mountPixelBlast(pixelContainer, {
          variant: 'square',
          pixelSize: 3.5,
          color: '#8b7eea',
          patternScale: 2,
          patternDensity: 0.55,
          speed: 0.25,
          edgeFade: 0.55
        })
      } catch (e) {
        console.error('PixelBlast mount failed:', e)
      }
    }
  }

  function mountType() {
    if (typeContainer && !textType) {
      try {
        textType = initTextType(typeContainer, {
          words: [
            'IT Support Engineer',
            'Web Developer',
            'IT Infrastructure & Networking',
            'Expanding into AI Engineering'
          ],
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

  // Boot: run the pixel background + typewriter behind the Gio loader; the
  // profile entrance plays as the grid wipes away (in the loader onComplete).
  mountPixel()
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
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      gsap.to(modeSwitch, { rotation: '+=360', duration: 0.6, ease: 'power2.inOut' })
      toggleMode()
      setTimeout(scrollToHero, 450)
    })
  }

  // Footer year, kept current automatically
  const footerYear = document.getElementById('footer-year')
  if (footerYear) footerYear.textContent = new Date().getFullYear()

  // Contact forms (Dev section + vCard Contact tab): no backend, so hand the
  // message to the visitor's own email client pre-filled, and confirm.
  document.querySelectorAll('.contact-form').forEach(contactForm => {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const name = contactForm.querySelector('[name="name"]')?.value.trim() || ''
      const email = contactForm.querySelector('[name="email"]')?.value.trim() || ''
      const subject = contactForm.querySelector('[name="subject"]')?.value.trim() || 'Project inquiry'
      const message = contactForm.querySelector('[name="message"]')?.value.trim() || ''
      const note = contactForm.querySelector('.form-note')

      const body = `${message}\n\n— ${name}${email ? ' (' + email + ')' : ''}`
      const mailto = `mailto:joecelpergis@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.location.href = mailto

      if (note) note.textContent = 'Opening your email app with this message pre-filled…'
    })
  })

  try { initHelpers() } catch (e) { console.error('helpers init failed:', e) }
  try { initTextReveal() } catch (e) { console.error('text-reveal init failed:', e) }
  try { initTextMorph() } catch (e) { console.error('text-morph init failed:', e) }
  try {
    playLoader({
      brand: 'Gio',
      onComplete: () => {
        initProfile()
        const lenis = initLenis()
        window.lenisInstance = lenis
        setLenis(lenis)
        // Hydrate CMS content before animations so ScrollTrigger picks up the
        // dynamically-rendered project cards / testimonials. Falls back to the
        // static sections when the API is unreachable.
        initApiContent().finally(() => {
          try { initAnimations() } catch (e) { console.error('animations init failed:', e) }
        })
      }
    })
  } catch (e) {
    console.error('loader init failed:', e)
    initProfile()
  }
})
