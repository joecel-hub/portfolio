import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initAnimations() {
  try {
  const heroTl = gsap.timeline({ delay: 0.1 })
  heroTl
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .from('.hero-title .word', { y: '110%', skewY: 5, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, '-=0.5')
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    .to('.hero-scroll-cue', { opacity: 1, duration: 0.6 }, '-=0.3')
    .to('.hero-badge', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')

  gsap.to('.hero-title', {
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
    y: -80, opacity: 0.3
  })

  gsap.fromTo('.about-text > .dev-only > *',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.8, stagger: 0.11, ease: 'power2.out',
      scrollTrigger: { trigger: '#about', start: 'top 72%' }
    }
  )
  gsap.fromTo('.about-text > .normal-only > *',
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.8, stagger: 0.11, ease: 'power2.out',
      scrollTrigger: { trigger: '#about', start: 'top 72%' }
    }
  )
  gsap.from('.stat-card', {
    scrollTrigger: { trigger: '.about-stats', start: 'top 80%' },
    opacity: 0, scale: 0.88, duration: 0.6, stagger: 0.08, ease: 'back.out(1.5)'
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

  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'))
    ScrollTrigger.create({
      trigger: el, start: 'top 82%', once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target, duration: 1.5, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(this.targets()[0].val) + '+' }
        })
      }
    })
  })

  if (document.getElementById('orb')) {
    const orbTl = gsap.timeline({ repeat: -1, yoyo: true })
    orbTl.to('#orb', { scale: 1.06, duration: 2.2, ease: 'sine.inOut', transformOrigin: 'center' })
    gsap.to(['#bracket-l', '#code-txt'], { y: -10, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true })
    gsap.to(['#bracket-r', '#code-txt2'], { y: 9, duration: 3.3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.8 })
    gsap.to(['#deco1', '#deco2', '#deco3', '#deco4'], { rotation: 45, duration: 7, ease: 'none', repeat: -1, transformOrigin: 'center', stagger: 1.6 })

    orbitDot('dot1-nm', 170, 60, 200, 200, 6, 0)
    orbitDot('dot2-nm', 130, 45, 200, 200, 9, 0.33)
    orbitDot('dot3-nm', 90, 30, 200, 200, 5, 0.66)
    orbitDot('dot4-nm', 170, 60, 200, 200, 11, 0.5)
  }

  const CIRC = 264
  document.querySelectorAll('.ring-item').forEach((item, i) => {
    const pct = parseInt(item.dataset.pct) / 100
    const ring = item.querySelector('.ring-fill')
    gsap.to(ring, {
      scrollTrigger: { trigger: '#skills-dev', start: 'top 72%' },
      strokeDashoffset: CIRC * (1 - pct), duration: 1.5, delay: i * 0.1, ease: 'power3.out'
    })
    gsap.from(item, {
      scrollTrigger: { trigger: '#skills-dev', start: 'top 72%' },
      opacity: 0, y: 30, duration: 0.7, delay: i * 0.09, ease: 'power2.out'
    })
  })

  document.querySelectorAll('.skill-bar').forEach(bar => {
    const w = bar.getAttribute('data-width') || 80
    ScrollTrigger.create({
      trigger: bar, start: 'top 88%', once: true,
      onEnter: () => gsap.to(bar, { width: w + '%', duration: 1.3, ease: 'power2.out', delay: 0.15 })
    })
  })

  gsap.from('.skill-card', {
    scrollTrigger: { trigger: '#skills-dev,#skills-normal', start: 'top 72%' },
    opacity: 0, y: 50, duration: 0.7, stagger: 0.09, ease: 'power3.out'
  })
  gsap.from('.hobby-card', {
    scrollTrigger: { trigger: '#hobbies', start: 'top 75%' },
    opacity: 0, y: 50, duration: 0.7, stagger: 0.1, ease: 'power3.out'
  })

  gsap.from('.project-card', {
    scrollTrigger: { trigger: '#projects', start: 'top 72%' },
    opacity: 0, y: 60, duration: 0.8, stagger: 0.13, ease: 'power3.out'
  })

  ;[
    { sel: '#wave1a', d: 'M80 90 Q200 25 300 90 Q400 155 520 90', delay: 0 },
    { sel: '#wave1b', d: 'M80 110 Q200 45 300 110 Q400 175 520 110', delay: 0.5 }
  ].forEach(({ sel, d, delay }) => {
    const el = document.querySelector(sel)
    if (el) gsap.to(el, { attr: { d }, duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay })
  })

  gsap.from('.process-step', {
    scrollTrigger: { trigger: '#process', start: 'top 72%' },
    opacity: 0, x: -40, duration: 0.7, stagger: 0.13, ease: 'power2.out'
  })

  gsap.from('.tl-item', {
    scrollTrigger: { trigger: '#resume', start: 'top 75%' },
    opacity: 0, x: -25, duration: 0.7, stagger: 0.12, ease: 'power2.out'
  })

  document.querySelectorAll('.section-title').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      }
    )
  })

  gsap.from('.contact-form > *,#contact > *', {
    scrollTrigger: { trigger: '#contact', start: 'top 72%' },
    opacity: 0, y: 35, duration: 0.8, stagger: 0.09, ease: 'power2.out'
  })

  const glow = document.createElement('div')
  glow.style.cssText = 'position:fixed;width:700px;height:700px;border-radius:50%;pointer-events:none;z-index:0;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(124,110,255,0.06),transparent 70%)'
  document.body.appendChild(glow)
  const xTo = gsap.quickTo(glow, 'x', { duration: 0.8, ease: 'power3' })
  const yTo = gsap.quickTo(glow, 'y', { duration: 0.8, ease: 'power3' })
  window.addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY) })
  ScrollTrigger.refresh()
  } catch (e) { console.error('initAnimations error:', e) }
}

function orbitDot(id, rx, ry, cx, cy, dur, off) {
  gsap.to({}, {
    duration: dur, repeat: -1, ease: 'none',
    onUpdate: function () {
      const t = (this.progress() + off) * Math.PI * 2
      const el = document.getElementById(id)
      if (el) { el.setAttribute('cx', cx + Math.cos(t) * rx); el.setAttribute('cy', cy + Math.sin(t) * ry) }
    }
  })
}
