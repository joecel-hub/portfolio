import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { playLoader } from './loader.js'

gsap.registerPlugin(ScrollTrigger)

// Browser UI tint (mobile address bar) follows the active identity.
const THEME_COLOR = { normal: '#f6f7fb', dev: '#0a0a0f' }

export function syncThemeColor(isNormal) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isNormal ? THEME_COLOR.normal : THEME_COLOR.dev)
}

export function initModeToggle(devBg, callbacks = {}) {
  let isNormal = true // Normal (Gio) is the default mode

  function closeMenu() {
    const links = document.getElementById('nav-links')
    const ham = document.getElementById('ham-btn')
    const backdrop = document.getElementById('nav-backdrop')
    if (links && links.classList.contains('open')) {
      links.classList.remove('open')
      ham.classList.remove('open')
      ham.setAttribute('aria-expanded', 'false')
      if (backdrop) backdrop.classList.remove('open')
      document.body.style.overflow = ''
    }
  }

  function toggleMode() {
    isNormal = !isNormal
    closeMenu()
    gsap.to(['#app', '#site-footer'], {
      opacity: 0, duration: 0.25, onComplete: () => {
        document.body.classList.toggle('normal-mode', isNormal)
        syncThemeColor(isNormal)

        if (devBg) {
          devBg.setPaused(isNormal)
        }

        if (isNormal && callbacks.onToNormal) callbacks.onToNormal()
        if (!isNormal && callbacks.onToDev) callbacks.onToDev()

        if (isNormal) {
          // Back to the profile — a quick fade is enough.
          gsap.to(['#app', '#site-footer'], { opacity: 1, duration: 0.4, ease: 'power2.out' })
          finalize()
        } else {
          // Entering the studio — replay the Stryg.Bytes grid loader.
          playLoader({
            brand: 'Stryg.Bytes',
            onComplete: () => {
              gsap.to(['#app', '#site-footer'], { opacity: 1, duration: 0.4, ease: 'power2.out' })
              finalize()
            }
          })
        }
      }
    })
  }

  function finalize() {
    // Sections appear/disappear with the mode, so recalculate every
    // ScrollTrigger's start/end positions against the new layout.
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }

  return { toggleMode }
}
