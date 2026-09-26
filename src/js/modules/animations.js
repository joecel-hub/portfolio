import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { animateTextReveal } from './text-reveal.js'
import { prefersReducedMotion } from '../utils/motion.js'

gsap.registerPlugin(ScrollTrigger)

// Reduced motion: put everything in its final, visible state — no reveals,
// parallax, pinning, looping tweens or cursor glow.
function showStatic() {
  gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-bot-card', '.hero-cta', '.hero-scroll-cue', '.hero-badge'], { opacity: 1, y: 0, scale: 1 })
  gsap.set(['#active-h1', '#active-v1', '#active-h2'], { strokeDashoffset: 0 })
  document.getElementById('svg-circuit')?.pauseAnimations?.()
  ScrollTrigger.refresh()
}

export function initAnimations() {
  if (prefersReducedMotion) {
    try { showStatic() } catch (e) { console.error('showStatic error:', e) }
    return
  }
  try {
    animateTextReveal()
  const heroTl = gsap.timeline({ delay: 0.1 })
  heroTl
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .from('.hero-title .word', { y: '110%', skewY: 5, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, '-=0.5')
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
    .to('.hero-bot-card', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.45')
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    .to('.hero-scroll-cue', { opacity: 1, duration: 0.6 }, '-=0.3')
    .to('.hero-badge', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')

  // fromTo (not to) so the scrubbed "return to top" state is always the
  // settled, fully-visible values below — not whatever opacity:0 CSS
  // default happened to be on screen the instant this tween was created
  // (that stale-capture bug is what made the hero-bot-card vanish when
  // scrolling back up).
  gsap.fromTo('.hero-title',
    { y: 0, opacity: 1 },
    {
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
      y: -80, opacity: 0.3
    }
  )
  gsap.fromTo('.hero-bot-card',
    { y: 0, opacity: 1, scale: 1 },
    {
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
      y: -40, opacity: 0.35, scale: 0.94
    }
  )

  gsap.fromTo('.about-text > .dev-only > *',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.8, stagger: 0.11, ease: 'power2.out',
      scrollTrigger: { trigger: '#about', start: 'top 72%' }
    }
  )
  gsap.from('.value-card', {
    scrollTrigger: { trigger: '.value-cards', start: 'top 80%' },
    opacity: 0, y: 36, duration: 0.7, stagger: 0.1, ease: 'power3.out'
  })
  gsap.from('#svg-circuit', {
    scrollTrigger: { trigger: '#about', start: 'top 70%' },
    opacity: 0, x: 60, duration: 1.1, ease: 'power3.out'
  })

  const cTL = gsap.timeline({ scrollTrigger: { trigger: '#about', start: 'top 62%' } })
  cTL
    .to('#active-h1', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' })
    .to('#active-v1', { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '-=0.3')
    .to('#active-h2', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, '-=0.3')
  gsap.from('.node', {
    scrollTrigger: { trigger: '#about', start: 'top 62%' },
    scale: 0, transformOrigin: 'center', duration: 0.5, stagger: 0.07, ease: 'back.out(3)'
  })
  gsap.to('.pulse-node', { scale: 1.6, opacity: 0.5, duration: 1.3, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: 'center' })

  gsap.from('.svc-card', {
    scrollTrigger: { trigger: '#skills-dev', start: 'top 72%' },
    opacity: 0, y: 56, duration: 0.9, stagger: 0.14, ease: 'power3.out'
  })
  gsap.from('.services-lead', {
    scrollTrigger: { trigger: '#skills-dev', start: 'top 78%' },
    opacity: 0, y: 20, duration: 0.7, ease: 'power2.out'
  })
  gsap.from('.svc-bg-orb', {
    scrollTrigger: { trigger: '#skills-dev', start: 'top 80%' },
    opacity: 0, scale: 0.7, duration: 1.4, stagger: 0.15, ease: 'power2.out'
  })

  gsap.from('.project-card', {
    scrollTrigger: { trigger: '#projects', start: 'top 72%' },
    opacity: 0, y: 60, duration: 0.8, stagger: 0.13, ease: 'power3.out'
  })
  document.querySelectorAll('.project-thumb').forEach((thumb) => {
    const art = thumb.querySelector('svg') // screenshot cards have an <img> instead
    if (!art) return
    gsap.to(art, {
      y: -18,
      ease: 'none',
      scrollTrigger: { trigger: thumb, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    })
  })

  // The testimonials section is only shown once a testimonial is approved.
  if (!document.getElementById('testimonials')?.hidden) {
    gsap.from('.t-card', {
      scrollTrigger: { trigger: '#testimonials', start: 'top 72%' },
      opacity: 0, y: 50, duration: 0.8, stagger: 0.12, ease: 'power3.out'
    })
    gsap.from('.client-logo', {
      scrollTrigger: { trigger: '#testimonials', start: 'top 80%' },
      opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out'
    })
  }

  document.querySelectorAll('.section-title').forEach(el => {
    if (el.closest('#profile')) return
    gsap.fromTo(el,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      }
    )
  })

  gsap.from('#contact > *', {
    scrollTrigger: { trigger: '#contact', start: 'top 72%' },
    opacity: 0, y: 35, duration: 0.8, stagger: 0.09, ease: 'power2.out'
  })

  const glow = document.createElement('div')
  glow.style.cssText = 'position:fixed;width:700px;height:700px;border-radius:50%;pointer-events:none;z-index:0;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(var(--a1-rgb),0.06),transparent 70%)'
  document.body.appendChild(glow)
  const xTo = gsap.quickTo(glow, 'x', { duration: 0.8, ease: 'power3' })
  const yTo = gsap.quickTo(glow, 'y', { duration: 0.8, ease: 'power3' })
  window.addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY) })
  ScrollTrigger.refresh()
  } catch (e) { console.error('initAnimations error:', e) }
}
