import gsap from 'gsap'

export function initCursor() {
  const cursor = document.getElementById('cursor')
  const dot = cursor.querySelector('.cursor-dot')
  const ring = cursor.querySelector('.cursor-ring')
  let mx = 0, my = 0, rx = 0, ry = 0
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.11; ry += (my - ry) * 0.11
    gsap.set(dot, { x: mx, y: my })
    gsap.set(ring, { x: rx, y: ry })
  })
  document.querySelectorAll('a,button,.project-card,.skill-card,.hobby-card,.stat-card').forEach(el => {
    el.addEventListener('mouseenter', () => gsap.to(ring, { scale: 1.9, opacity: 0.5, duration: 0.3 }))
    el.addEventListener('mouseleave', () => gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 }))
  })
}
