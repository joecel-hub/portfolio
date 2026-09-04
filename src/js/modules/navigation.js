import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'

let lenisInstance = null

gsap.registerPlugin(ScrollTrigger)

export function setLenis(instance) {
  lenisInstance = instance
}

export function initNavigation() {
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

  document.querySelectorAll('.rn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = resolveTarget(btn.dataset.target)
      const el = document.getElementById(id)
      if (el) {
        if (lenisInstance) {
          lenisInstance.scrollTo(el, { offset: 0, duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      document.querySelectorAll('.rn-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  document.querySelectorAll('.rn-btn').forEach(btn => {
    const targetId = resolveTarget(btn.dataset.target)
    const el = document.getElementById(targetId)
    // Profile sections share the single #profile region in normal mode;
    // skip scrollspy for those so they don't all highlight at once.
    if (!el || targetId === 'profile' || targetId.startsWith('pf-')) return

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

  function closeMenu() {
    links.classList.remove('open')
    ham.classList.remove('open')
    backdrop.classList.remove('open')
    document.body.style.overflow = ''
  }

  function toggleMenu() {
    const open = links.classList.toggle('open')
    ham.classList.toggle('open')
    backdrop.classList.toggle('open')
    document.body.style.overflow = open ? 'hidden' : ''
  }

  const ham = document.getElementById('ham-btn')
  const links = document.getElementById('nav-links')
  const closeBtn = document.getElementById('nav-close')
  const backdrop = document.getElementById('nav-backdrop')
  if (ham && links) {
    ham.addEventListener('click', toggleMenu)
    if (closeBtn) closeBtn.addEventListener('click', closeMenu)
    if (backdrop) backdrop.addEventListener('click', closeMenu)
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
              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  }

  const aboutEl = document.getElementById('nav-about')
  const skEl = document.getElementById('nav-skills')
  const wkEl = document.getElementById('nav-work')
  const contactEl = document.getElementById('nav-contact')
  function updateNavLinks() {
    const nm = document.body.classList.contains('normal-mode')
    if (aboutEl) aboutEl.href = nm ? '#pf-about' : '#about'
    if (skEl) skEl.href = nm ? '#pf-about' : '#skills-dev'
    if (wkEl) { wkEl.href = nm ? '#pf-resume' : '#projects'; wkEl.textContent = nm ? 'Resume' : 'Work' }
    if (contactEl) contactEl.href = nm ? '#pf-contact' : '#contact'
  }
  updateNavLinks()
  const mo = new MutationObserver(updateNavLinks)
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
}
