import './styles/style.css'
import { initLoader } from './js/modules/loader.js'
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

document.addEventListener('DOMContentLoaded', () => {

  const particles = initDevParticles(document.getElementById('dev-particles-canvas'), {
    count: 50,
    color: '124, 110, 255',
    maxOpacity: 0.35,
    speed: 0.15,
    mouseRadius: 100,
    mouseStrength: 0.4
  })

  const heroBot = initHeroBot(document.getElementById('hero-bot'))

  // Normal mode only exists behind the "Meet Gio" gate — the site always
  // opens in Dev mode — so these are mounted lazily on first switch rather
  // than eagerly here. Mounting them on load ran a full WebGL shader
  // background and two animation loops the whole time a visitor was
  // looking at the (unrelated) Dev mode hero, for no visible benefit.
  let textType = null
  const typeContainer = document.getElementById('pf-role')

  let unmountPixel = null
  const pixelContainer = document.getElementById('pixel-blast-container')

  const { toggleMode } = initModeToggle(particles, {
    onToNormal: () => {
      if (heroBot) heroBot.setPaused(true)
      if (pixelContainer && !unmountPixel) {
        unmountPixel = mountPixelBlast(pixelContainer, {
          variant: 'square',
          pixelSize: 3.5,
          color: '#8b7eea',
          patternScale: 2,
          patternDensity: 0.55,
          speed: 0.25,
          edgeFade: 0.55
        })
      }
      if (typeContainer && !textType) {
        textType = initTextType(typeContainer, {
          words: [
            'IT Engineer & Full Stack Developer',
            'Full-Stack Web Developer',
            'IT Support Specialist',
            'Creative Problem Solver'
          ],
          typingSpeed: 60,
          deletingSpeed: 30,
          pauseDuration: 2500,
          initialDelay: 1000
        })
      }
      initProfile()
    },
    onToDev: () => {
      if (heroBot) heroBot.setPaused(false)
      if (textType) {
        textType.destroy()
        textType = null
      }
      if (unmountPixel) {
        unmountPixel()
        unmountPixel = null
      }
    }
  })

  initNavigation()

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

  const gateBtn = document.querySelector('.gate-btn')
  if (gateBtn) {
    gateBtn.addEventListener('click', () => {
      toggleMode()
      setTimeout(scrollToHero, 450)
    })
  }

  // Two-way mode switch: "Meet Gio" (above) goes Dev -> Normal.
  // The logo and the "Studio" pill go back Normal -> Dev, so visitors
  // are never stuck in one mode with no way out.
  const navLogo = document.getElementById('nav-logo')

  function goHomeOrSwitchBack() {
    if (document.body.classList.contains('normal-mode')) {
      toggleMode()
      setTimeout(scrollToHero, 450)
    } else {
      scrollToHero()
    }
  }

  if (navLogo) {
    navLogo.addEventListener('click', goHomeOrSwitchBack)
    navLogo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        goHomeOrSwitchBack()
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
      const mailto = `mailto:hello@stryg.bytes?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.location.href = mailto

      if (note) note.textContent = 'Opening your email app with this message pre-filled…'
    })
  })

  initHelpers()
  initTextReveal()
  initTextMorph()
  initLoader(() => {
    const lenis = initLenis()
    window.lenisInstance = lenis
    setLenis(lenis)
    initAnimations()
  })
})
