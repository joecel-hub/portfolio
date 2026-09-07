import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { playLoader } from './loader.js'

gsap.registerPlugin(ScrollTrigger)

export function initModeToggle(devBg, callbacks = {}) {
  let isNormal = true // Normal (Gio) is the default mode

  function closeMenu() {
    const links = document.getElementById('nav-links')
    const ham = document.getElementById('ham-btn')
    const backdrop = document.getElementById('nav-backdrop')
    if (links && links.classList.contains('open')) {
      links.classList.remove('open')
      ham.classList.remove('open')
      if (backdrop) backdrop.classList.remove('open')
      document.body.style.overflow = ''
    }
  }

  function toggleMode() {
    isNormal = !isNormal
    closeMenu()
    gsap.to('#app', {
      opacity: 0, duration: 0.25, onComplete: () => {
        document.body.classList.toggle('normal-mode', isNormal)

        if (devBg) {
          devBg.setPaused(isNormal)
        }

        if (isNormal && callbacks.onToNormal) callbacks.onToNormal()
        if (!isNormal && callbacks.onToDev) callbacks.onToDev()

        if (isNormal) {
          // Back to the profile — a quick fade is enough.
          gsap.to('#app', { opacity: 1, duration: 0.4, ease: 'power2.out' })
          finalize()
        } else {
          // Entering the studio — replay the Stryg.Bytes grid loader.
          playLoader({
            brand: 'Stryg.Bytes',
            onComplete: () => {
              gsap.to('#app', { opacity: 1, duration: 0.4, ease: 'power2.out' })
              finalize()
            }
          })
        }
      }
    })
  }

  function finalize() {
    // The Dev Process section is pinned by ScrollTrigger. Recalculate its
    // spacer after either mode changes visibility so it remains reachable.
    requestAnimationFrame(() => ScrollTrigger.refresh())
    setTimeout(() => {
      document.querySelectorAll('.skill-bar').forEach(bar => {
        const w = bar.getAttribute('data-width') || 80
        bar.style.width = '0%'
        setTimeout(() => { bar.style.width = w + '%'; bar.style.transition = 'width 1.2s ease' }, 50)
      })
    }, 350)
  }

  return { toggleMode }
}
