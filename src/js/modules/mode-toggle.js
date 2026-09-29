import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { playLoader } from './loader.js'
import { modeFromPath, pathForMode, applyModeMeta } from './mode-route.js'

gsap.registerPlugin(ScrollTrigger)

// Browser UI tint (mobile address bar) follows the active identity.
const THEME_COLOR = { normal: '#f6f7fb', dev: '#0a0a0f' }

export function syncThemeColor(isNormal) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isNormal ? THEME_COLOR.normal : THEME_COLOR.dev)
}

export function initModeToggle(devBg, callbacks = {}, initialMode = 'gio') {
  let isNormal = initialMode !== 'lab' // `/` boots Gio, `/lab` boots Stryg.Bytes

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

  // One switch at a time: clicks during a transition are ignored.
  let switching = false

  async function toggleMode({ push = true } = {}) {
    if (switching) return
    switching = true
    const from = isNormal ? 'gio' : 'lab'
    const mode = isNormal ? 'lab' : 'gio'
    // Keep the address bar shareable: / is Gio, /lab is Stryg.Bytes.
    if (push) history.pushState(null, '', pathForMode(mode))
    applyModeMeta(mode)
    closeMenu()
    document.dispatchEvent(new CustomEvent('modechange', { detail: { from, to: mode } }))
    // Leaving the lab: a short goodbye from the assistant before the fade.
    if (mode === 'gio' && callbacks.beforeToNormal) {
      try { await callbacks.beforeToNormal() } catch (e) { console.error('goodbye failed:', e) }
    }
    isNormal = mode === 'gio'
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

  // The current identity ('gio' | 'lab').
  const currentMode = () => (isNormal ? 'gio' : 'lab')

  // Back/Forward across a mode change. Hash-only entries keep the same
  // path, so they never flip the mode.
  window.addEventListener('popstate', () => {
    const wantNormal = modeFromPath(location.pathname) !== 'lab'
    if (wantNormal !== isNormal) toggleMode({ push: false })
  })

  function finalize() {
    switching = false
    // Sections appear/disappear with the mode, so recalculate every
    // ScrollTrigger's start/end positions against the new layout.
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }

  return { toggleMode, currentMode }
}
