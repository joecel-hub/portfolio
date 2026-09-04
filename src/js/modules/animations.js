import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { animateTextReveal } from './text-reveal.js'

gsap.registerPlugin(ScrollTrigger)

export function initAnimations() {
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
  gsap.from('.about-stats-bar', {
    scrollTrigger: { trigger: '.about-stats-bar', start: 'top 85%' },
    opacity: 0, y: 24, duration: 0.7, ease: 'power2.out'
  })
  gsap.from('.bar-stat', {
    scrollTrigger: { trigger: '.about-stats-bar', start: 'top 85%' },
    opacity: 0, y: 12, duration: 0.5, stagger: 0.08, ease: 'power2.out'
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

  document.querySelectorAll('.skill-bar').forEach(bar => {
    const w = bar.getAttribute('data-width') || 80
    ScrollTrigger.create({
      trigger: bar, start: 'top 88%', once: true,
      onEnter: () => gsap.to(bar, { width: w + '%', duration: 1.3, ease: 'power2.out', delay: 0.15 })
    })
  })

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
    gsap.to(thumb.querySelector('svg'), {
      y: -18,
      ease: 'none',
      scrollTrigger: { trigger: thumb, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    })
  })

  ;[
    { sel: '#wave1a', d: 'M80 90 Q200 25 300 90 Q400 155 520 90', delay: 0 },
    { sel: '#wave1b', d: 'M80 110 Q200 45 300 110 Q400 175 520 110', delay: 0.5 }
  ].forEach(({ sel, d, delay }) => {
    const el = document.querySelector(sel)
    if (el) gsap.to(el, { attr: { d }, duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay })
  })

  const ptSteps = document.querySelectorAll('#process .pt-step')
  const ptTimeline = document.querySelector('#process .process-timeline')
  const ptLine = document.querySelector('#process .pt-line')


  if (ptSteps.length && ptTimeline) {
    let totalShift = 0

    function calcShift() {
      const headerH = document.querySelector('#process > .sec-inner')?.offsetHeight || 0
      return Math.max(0, ptTimeline.scrollHeight + 50 - (window.innerHeight - headerH - 40))
    }

    totalShift = calcShift()
    const revealed = new Set()

    const firstIcon = ptSteps[0]?.querySelector('.pt-icon')
    const firstCard = ptSteps[0]?.querySelector('.pt-card')
    if (firstIcon) gsap.set(firstIcon, { opacity: 1, scale: 1 })
    if (firstCard) gsap.set(firstCard, { opacity: 1, y: 0 })
    ptSteps[0]?.classList.add('is-active')
    ptSteps[0]?.querySelector('.pt-dot')?.classList.add('is-active')
    revealed.add(0)

    ptSteps.forEach((step, i) => {
      const iconSvg = step.querySelector('.pt-icon svg')
      if (iconSvg) {
        gsap.to(iconSvg, { y: -4, duration: 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.15 })
      }
    })

    ScrollTrigger.create({
      trigger: '#process',
      pin: true,
      scrub: 1,
      start: 'top top',
      end: () => `+=${Math.max(calcShift() + 100, window.innerHeight * 0.4)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        totalShift = calcShift()
        const p = self.progress
        gsap.set(ptTimeline, { y: -p * totalShift })

        ptSteps.forEach((step, i) => {
          if (revealed.has(i)) return
          const r = step.getBoundingClientRect()
          if (r.top >= window.innerHeight || r.bottom <= 0) return

          revealed.add(i)
          step.classList.add('is-active')
          const icon = step.querySelector('.pt-icon')
          const card = step.querySelector('.pt-card')
          const dot = step.querySelector('.pt-dot')
          if (icon) gsap.fromTo(icon, { opacity: 0.3, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.7)', overwrite: 'auto' })
          if (card) gsap.fromTo(card, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: 'power2.out', overwrite: 'auto' })
          if (dot) dot.classList.add('is-active')
        })

        if (ptLine) gsap.set(ptLine, { scaleY: p })
      }
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
