import gsap from 'gsap'

export function initTextMorph() {
  const words = [
    'Interactive Web Experiences',
    'Creative Development & Motion',
    'SaaS & Web Applications',
    'UI, Animation & Infrastructure',
    'Selected Works & Experiments',
  ]

  let current = 0

  function getActiveEyebrow() {
    if (document.body.classList.contains('normal-mode')) return null
    return document.querySelector('#hero-dev-content .hero-eyebrow')
  }

  function morph() {
    current = (current + 1) % words.length
    const nextWord = words[current]
    const el = getActiveEyebrow()
    if (!el) return

    gsap.to(el, {
      opacity: 0,
      y: -8,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        el.textContent = nextWord
        gsap.fromTo(
          el,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        )
      },
    })
  }

  setInterval(morph, 4000)
}
