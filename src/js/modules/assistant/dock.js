import * as THREE from 'three'
import { loadRobot, createRobotInstance, addRobotLights } from '../robot/model.js'
import { createExpressions } from '../robot/expressions.js'

// The small docked copy of the robot-cube that keeps the visitor company
// through the lab once the hero (and its big robot) has scrolled away. Same
// model and expressions as the hero; its own tiny canvas. It only renders
// while shown and the tab is visible, capped at 30 fps: the hero's loop is
// paused off-screen, so only one robot draws at a time.

const FPS = 30
// Resting glance: up and to the left, toward the page content.
const REST_LOOK = { x: -0.28, y: -0.08 }

export async function createDockRobot(container, { reduceMotion = false } = {}) {
  const loaded = await loadRobot()

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 1.5, 5.8)
  camera.lookAt(0, -0.1, 0)
  addRobotLights(scene)

  const robot = createRobotInstance(loaded, { reduceMotion })
  robot.idle?.play()
  const expr = createExpressions(robot, { reduceMotion })
  expr.setLook(REST_LOOK.x, REST_LOOK.y)
  scene.add(robot.model)

  function resize() {
    const s = container.clientWidth || 1
    renderer.setSize(s, s)
  }
  resize()
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  ro?.observe(container)

  let running = false
  let raf = 0
  let last = 0
  let acc = 0
  let lookUntil = 0
  let time = 0

  function frame(now) {
    raf = 0
    if (!running) return
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    acc += dt
    if (acc >= 1 / FPS) {
      step(Math.min(acc, 0.1))
      acc = 0
    }
    raf = requestAnimationFrame(frame)
  }
  function step(dt) {
    time += dt
    if (lookUntil && time > lookUntil) { lookUntil = 0; expr.setLook(REST_LOOK.x, REST_LOOK.y) }
    expr.update(dt)
    renderer.render(scene, camera)
  }
  // Reduced motion: no loop, just redraw when something changes.
  function redraw() { if (reduceMotion) step(1) }

  function start() {
    if (running) return
    running = true
    if (reduceMotion) { redraw(); return }
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    running = false
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  // Look toward a screen point for a moment (a section, a project card).
  function lookAtPoint(clientX, clientY, seconds = 2) {
    const r = container.getBoundingClientRect()
    const clamp1 = (v) => Math.max(-1, Math.min(1, v))
    const x = clamp1((clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)) * 0.6
    const y = clamp1((clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)) * 0.3
    expr.setLook(x, y)
    lookUntil = time + seconds
    redraw()
  }

  function dispose() {
    stop()
    ro?.disconnect()
    robot.dispose()
    renderer.forceContextLoss()
    renderer.dispose()
    renderer.domElement.remove()
  }

  step(0)
  return {
    start,
    stop,
    lookAtPoint,
    react: (name) => { expr.play(name); redraw() },
    setMood: (mood) => { expr.setMood(mood); redraw() },
    dispose
  }
}
