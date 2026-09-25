import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import { prefersReducedMotion } from '../utils/motion.js'

let lenisInstance = null

gsap.registerPlugin(ScrollTrigger)

export function setLenis(instance) {
  lenisInstance = instance
}

export function initNavigation() {
  const navErrors = []
  function noteError(msg, e) {
    navErrors.push(msg + ': ' + (e && e.message ? e.message : e))
    console.error(msg, e)
  }
  window.__navErrors = navErrors

  // ── MENU WIRING FIRST ──
  // The hamburger/off-canvas menu must be wired as the very first action so it
  // can NEVER be skipped by a failure in the scrollspy / rn-btn logic below.
  const isOpen = () => links.classList.contains('open')

  // Visible, focusable controls inside the off-canvas panel (for the Tab trap).
  function focusables() {
    return [...links.querySelectorAll('a[href], button:not([disabled])')]
      .filter(el => el.offsetParent !== null)
  }

  function setOpen(open) {
    links.classList.toggle('open', open)
    ham.classList.toggle('open', open)
    if (backdrop) backdrop.classList.toggle('open', open)
    ham.setAttribute('aria-expanded', String(open))
    document.body.style.overflow = open ? 'hidden' : ''
  }

  function openMenu() {
    setOpen(true)
    // Move focus into the panel once it is visible.
    setTimeout(() => focusables()[0]?.focus(), 60)
  }

  function closeMenu({ restoreFocus = false } = {}) {
    const wasOpen = isOpen()
    setOpen(false)
    if (wasOpen && restoreFocus) ham.focus()
  }

  function toggleMenu() {
    if (isOpen()) closeMenu({ restoreFocus: true })
    else openMenu()
  }

  function onMenuKeydown(e) {
    if (!isOpen()) return
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu({ restoreFocus: true })
    } else if (e.key === 'Tab') {
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      else if (!links.contains(document.activeElement)) { e.preventDefault(); first.focus() }
    }
  }

  const ham = document.getElementById('ham-btn')
  const links = document.getElementById('nav-links')
  const closeBtn = document.getElementById('nav-close')
  const backdrop = document.getElementById('nav-backdrop')
  if (ham && links) {
    ham.setAttribute('aria-expanded', 'false')
    ham.addEventListener('click', toggleMenu)
    document.addEventListener('keydown', onMenuKeydown)
    if (closeBtn) closeBtn.addEventListener('click', () => closeMenu({ restoreFocus: true }))
    if (backdrop) backdrop.addEventListener('click', () => closeMenu({ restoreFocus: true }))
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href')
        if (href && href.startsWith('#')) {
          e.preventDefault()
          const id = href.slice(1)
          const el = document.getElementById(id)
          if (el) {
            if (lenisInstance) {
              lenisInstance.scrollTo(el, { offset: 0, duration: 1.2 })
            } else {
              el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
            }
          }
        }
        closeMenu()
      })
    })
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && links.classList.contains('open')) {
        closeMenu()
      }
    })
  } else {
    noteError('menu wiring skipped: ham/links missing', { ham: !!ham, links: !!links })
  }

  // ── NAV-LINK MAPPING ──
  const aboutEl = document.getElementById('nav-about')
  const skEl = document.getElementById('nav-skills')
  const wkEl = document.getElementById('nav-work')
  const contactEl = document.getElementById('nav-contact')
  function updateNavLinks() {
    try {
      const nm = document.body.classList.contains('normal-mode')
      if (aboutEl) aboutEl.href = nm ? '#pf-about' : '#about'
      if (skEl) skEl.href = nm ? '#pf-about' : '#skills-dev'
      if (wkEl) { wkEl.href = nm ? '#pf-resume' : '#projects'; wkEl.textContent = nm ? 'Experience' : 'Work' }
      if (contactEl) contactEl.href = nm ? '#pf-contact' : '#contact'
    } catch (e) { noteError('updateNavLinks', e) }
  }
  try {
    updateNavLinks()
    const mo = new MutationObserver(updateNavLinks)
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  } catch (e) { noteError('mutation observer', e) }

  // ── RIGHT-RAIL (Dev scrollspy + clicks) — optional, must not break menu ──
  function isNormal() {
    return document.body.classList.contains('normal-mode')
  }

  function resolveTarget(id) {
    if (isNormal()) {
      if (id === 'hero') return 'profile'
      if (id === 'about') return 'pf-about'
      if (id === 'contact') return 'pf-contact'
    }
    return id
  }

  try {
    document.querySelectorAll('.rn-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = resolveTarget(btn.dataset.target)
        const el = document.getElementById(id)
        if (el) {
          if (lenisInstance) {
            lenisInstance.scrollTo(el, { offset: 0, duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
          } else {
            el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
          }
        }
        document.querySelectorAll('.rn-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
      })
    })

    // Right-rail scrollspy for Dev sections. Created once at init; skipped for
    // hidden/Profile targets. Guarded so it can never abort the menu wiring.
    document.querySelectorAll('.rn-btn').forEach(btn => {
      const id = btn.dataset.target
      const el = document.getElementById(id)
      if (!el || id === 'profile' || id.startsWith('pf-')) return

      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) {
            document.querySelectorAll('.rn-btn').forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
          }
        }
      })
    })

    window.addEventListener('scroll', () => {
      const topnav = document.getElementById('topnav')
      if (topnav) topnav.classList.toggle('scrolled', window.scrollY > 60)
    })
  } catch (e) {
    noteError('right-rail init', e)
  }
}
