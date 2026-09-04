export function initDevParticles(canvas, options = {}) {
  if (!canvas) return null

  const {
    count = 50,
    color = '124, 110, 255',
    maxOpacity = 0.35,
    minSize = 1,
    maxSize = 2,
    speed = 0.15,
    mouseRadius = 100,
    mouseStrength = 0.4
  } = options

  const ctx = canvas.getContext('2d')
  let particles = []
  let raf = null
  let paused = false
  let width = 0
  let height = 0
  let dpr = 1
  const mouse = { x: -9999, y: -9999 }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function createParticles() {
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: minSize + Math.random() * (maxSize - minSize),
      opacity: 0.1 + Math.random() * maxOpacity
    }))
  }

  function onPointerMove(e) {
    mouse.x = e.clientX
    mouse.y = e.clientY
  }

  function onPointerLeave() {
    mouse.x = -9999
    mouse.y = -9999
  }

  function tick() {
    if (paused) {
      raf = null
      return
    }

    ctx.clearRect(0, 0, width, height)

    for (const p of particles) {
      const dx = p.x - mouse.x
      const dy = p.y - mouse.y
      const dist = Math.hypot(dx, dy)

      if (dist < mouseRadius && dist > 0) {
        const force = (1 - dist / mouseRadius) * mouseStrength
        p.vx += (dx / dist) * force * 0.02
        p.vy += (dy / dist) * force * 0.02
      }

      p.vx *= 0.99
      p.vy *= 0.99
      p.x += p.vx
      p.y += p.vy

      if (p.x < -4) p.x = width + 4
      if (p.x > width + 4) p.x = -4
      if (p.y < -4) p.y = height + 4
      if (p.y > height + 4) p.y = -4

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${color}, ${p.opacity})`
      ctx.fill()
    }

    raf = requestAnimationFrame(tick)
  }

  function start() {
    if (!raf && !paused) raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  function onVisibility() {
    if (document.hidden) {
      stop()
    } else if (!paused) {
      start()
    }
  }

  function setPaused(val) {
    paused = !!val
    if (paused) {
      stop()
      ctx.clearRect(0, 0, width, height)
    } else {
      start()
    }
  }

  function destroy() {
    stop()
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerleave', onPointerLeave)
    document.removeEventListener('visibilitychange', onVisibility)
    particles = []
  }

  function onResize() {
    resize()
    createParticles()
  }

  resize()
  createParticles()
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  start()

  return { setPaused, destroy }
}
