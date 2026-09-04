import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initTextReveal() {
  document.querySelectorAll('.section-title').forEach((title) => {
    if (title.closest('#profile')) return
    const spans = title.querySelectorAll(':scope > span, :scope > span[style]')
    if (spans.length > 0) {
      spans.forEach((span) => {
        wrapNode(span)
      })
      return
    }

    const text = title.textContent.trim()
    if (!text) return
    title.textContent = ''
    const words = text.split(/\s+/)
    words.forEach((word, i) => {
      const wrap = document.createElement('span')
      wrap.style.display = 'inline-block'
      wrap.style.overflow = 'hidden'
      wrap.style.verticalAlign = 'bottom'

      const inner = document.createElement('span')
      inner.textContent = word
      inner.style.display = 'inline-block'
      inner.style.transform = 'translateY(100%)'
      inner.style.opacity = '0'

      wrap.appendChild(inner)
      title.appendChild(wrap)
      if (i < words.length - 1) {
        title.appendChild(document.createTextNode('\u00A0'))
      }
    })
  })
}

function wrapNode(node) {
  const text = node.textContent.trim()
  if (!text) return
  node.textContent = ''
  const words = text.split(/\s+/)
  words.forEach((word, i) => {
    const wrap = document.createElement('span')
    wrap.style.display = 'inline-block'
    wrap.style.overflow = 'hidden'
    wrap.style.verticalAlign = 'bottom'

    const inner = document.createElement('span')
    inner.textContent = word
    inner.style.display = 'inline-block'
    inner.style.transform = 'translateY(100%)'
    inner.style.opacity = '0'

    wrap.appendChild(inner)
    node.appendChild(wrap)
    if (i < words.length - 1) {
      node.appendChild(document.createTextNode('\u00A0'))
    }
  })
}

export function animateTextReveal() {
  document.querySelectorAll('.section-title').forEach((title) => {
    if (title.closest('#profile')) return
    const inners = title.querySelectorAll('span[style*="overflow"] > span')
    if (!inners.length) return

    gsap.fromTo(
      inners,
      { y: '100%', opacity: 0 },
      {
        y: '0%',
        opacity: 1,
        duration: 0.9,
        stagger: 0.04,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: title,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    )
  })

  document.querySelectorAll('.section-title span[style*="color"]').forEach((coloredSpan) => {
    if (coloredSpan.closest('#profile')) return
    const inner = coloredSpan.querySelector('span[style*="overflow"] > span')
    if (!inner) {
      const wraps = coloredSpan.querySelectorAll('span[style*="overflow"]')
      wraps.forEach((w) => {
        const inners2 = w.querySelectorAll(':scope > span')
        gsap.fromTo(
          inners2,
          { y: '100%', opacity: 0 },
          {
            y: '0%',
            opacity: 1,
            duration: 0.9,
            stagger: 0.04,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: coloredSpan.closest('.section-title'),
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      })
    }
  })
}
