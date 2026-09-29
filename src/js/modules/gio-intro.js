import * as THREE from 'three'
import { loadRobot, createRobotInstance, addRobotLights } from './robot/model.js'
import { createExpressions } from './robot/expressions.js'

// Gio first-visit intro (about 4.7 s, once per session; see intro-gate.js).
// A short, cinematic "meet the person behind the portfolio": the same
// robot-cube that later becomes the Stryg.Bytes assistant, alone in a quiet
// dark space with one floating cube. Five shots:
//
//   1. wide      the robot floats, idly watching the cube drift nearby
//   2. closer    it notices the cube: eyes widen, a small happy hop
//   3. low side  a low three-quarter angle on robot and cube
//   4. selfie    it turns to the camera and waves
//   5. reveal    the camera eases back and GIO appears
//
// Shots 1–3 cut; 4–5 flow. Each shot drifts slowly, so the cuts read as
// editing rather than jumps. Minimal on purpose: the robot is the focus and
// the cube only supports it.
//
// prepareGioIntro() loads everything and resolves when it can play without
// a stall; main.js races it against a short timeout and falls back to the
// normal loader if it isn't ready (or throws). play() resolves once the
// intro has faded out and been disposed.

const BG = 0x07080d
const VIOLET = new THREE.Color('#8b7eea') // Gio accent, lifted for a dark stage

// Seconds. Each shot runs from its start to the next one's.
const SHOTS = { wide: 0, closer: 1.2, low: 2.05, selfie: 2.85, reveal: 3.85 }
const T = {
  notice: 1.35,  // eyes widen toward the cube
  happy: 1.5,    // small hop
  turn: 2.95,    // looks at the camera
  wave: 3.15,    // waves
  title: 3.95,   // GIO + line
  end: 4.7       // reveal the page
}

// Camera per shot: start → end pose (position, look-at, fov; lookTo/fovTo
// when those move too). Landscape
// values; portrait pulls the camera back along the same line (placeCamera).
const CAM = {
  wide: { from: [1.4, 1.7, 12.6], to: [0.6, 1.45, 11.2], look: [-0.5, -0.1, 0], fov: 28 },
  closer: { from: [1.0, 0.8, 6.7], to: [0.7, 0.65, 6.1], look: [-0.85, 0.15, 0.5], fov: 30 },
  low: { from: [4.3, -0.85, 3.6], to: [4.0, -0.75, 4.2], look: [-0.45, 0.3, 0.3], fov: 34 },
  selfie: { from: [0.65, 0.75, 6.1], to: [0.4, 0.62, 5.5], look: [-0.1, 0, 0], fov: 34 },
  // Continues from where the selfie ends (same position, look-at and fov).
  reveal: { from: [0.4, 0.62, 5.5], to: [0, 1.05, 8.2], look: [-0.1, 0, 0], lookTo: [0, -0.5, 0], fov: 34, fovTo: 32 }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const span = (t, a, b) => clamp01((t - a) / (b - a))
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const easeOut = (p) => 1 - Math.pow(1 - p, 3)
const bump = (p) => Math.sin(Math.PI * clamp01(p)) // 0 → 1 → 0
const smooth = (p) => p * p * (3 - 2 * p)

// A soft radial gradient on a canvas: the floor pool, contact shadow and
// back glow are all just this on a plane.
function radialTexture(stops) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  stops.forEach(([at, color]) => g.addColorStop(at, color))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export async function prepareGioIntro() {
  const loaded = await loadRobot()

  const root = document.createElement('div')
  root.className = 'gio-intro'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  root.setAttribute('aria-label', 'Intro')
  root.innerHTML = `
    <div class="gi-stage" aria-hidden="true"></div>
    <div class="gi-title">
      <span class="gi-mark">GIO</span>
      <span class="gi-sub">IT Infrastructure <span aria-hidden="true">·</span> Web Development</span>
    </div>
    <button type="button" class="gi-skip">Skip intro</button>`
  const stage = root.querySelector('.gi-stage')
  const title = root.querySelector('.gi-title')
  const skip = root.querySelector('.gi-skip')

  // Throws without WebGL; main.js catches that and uses the normal loader.
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor(BG, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  stage.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  addRobotLights(scene)

  const robot = createRobotInstance(loaded)
  robot.idle?.play()
  const expr = createExpressions(robot, { glitch: false })
  scene.add(robot.model)

  const owned = [] // geometries/materials/textures to dispose
  const track = (...xs) => { owned.push(...xs); return xs[0] }

  // ── Environment: a pool of light on an unseen floor, a contact shadow
  // under the robot and a faint glow far behind. Nothing else. ──
  const FLOOR_Y = -1.35
  const flat = (tex, size) => {
    const mat = track(new THREE.MeshBasicMaterial({ map: track(tex), transparent: true, depthWrite: false }))
    return new THREE.Mesh(track(new THREE.PlaneGeometry(size, size)), mat)
  }
  const pool = flat(radialTexture([[0, 'rgba(96,110,210,0.30)'], [0.45, 'rgba(70,80,170,0.10)'], [1, 'rgba(0,0,0,0)']]), 14)
  pool.rotation.x = -Math.PI / 2
  pool.position.y = FLOOR_Y
  const shadow = flat(radialTexture([[0, 'rgba(0,0,0,0.65)'], [0.55, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]), 3.2)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = FLOOR_Y + 0.01
  const backGlow = flat(radialTexture([[0, 'rgba(139,126,234,0.16)'], [1, 'rgba(0,0,0,0)']]), 22)
  backGlow.position.set(0, 1, -9)
  scene.add(pool, shadow, backGlow)

  // ── The cube: dark, slightly metallic, with a thin violet edge and a
  // small light of its own that tints the robot's side as it passes. ──
  const cube = new THREE.Group()
  const cubeGeo = track(new THREE.BoxGeometry(0.46, 0.46, 0.46))
  cube.add(new THREE.Mesh(cubeGeo, track(new THREE.MeshStandardMaterial({
    color: 0x1b2038, metalness: 0.5, roughness: 0.3, emissive: VIOLET, emissiveIntensity: 0.12
  }))))
  const edgeMat = track(new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.9 }))
  cube.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(cubeGeo)), edgeMat))
  const cubeLight = new THREE.PointLight(VIOLET, 1.4, 3.5)
  cube.add(cubeLight)
  cube.rotation.set(0.5, 0.6, 0.1)
  scene.add(cube)

  // Where the cube floats: front-left of the robot, then up into the corner
  // of the selfie frame. Portrait pulls it in closer so it stays in shot.
  const CUBE_HOME = new THREE.Vector3(-1.7, 0.45, 1.45)
  const CUBE_SELFIE = new THREE.Vector3(-1.75, 0.95, 0.8)
  const cubeBase = new THREE.Vector3()

  // ── Framing ──
  let portrait = false
  let pull = 1 // how far portrait screens pull the camera back
  function resize() {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    portrait = camera.aspect < 0.9
    // Keeps most of the landscape framing's width without shrinking the
    // robot to nothing on a phone.
    pull = portrait ? Math.min(2.1, Math.sqrt(1.75 / camera.aspect)) : 1
  }

  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _look = new THREE.Vector3()
  const _pos = new THREE.Vector3()
  // Camera for shot `name` at progress p (0..1).
  function placeCamera(name, p, t) {
    const c = CAM[name]
    _look.fromArray(c.look)
    if (c.lookTo) _look.lerp(_b.fromArray(c.lookTo), p)
    // Portrait: aim at the middle of robot + cube (too narrow to frame off
    // centre), and end the reveal with the robot higher up, clear of the title.
    if (portrait) { _look.x = -0.1; if (name === 'reveal') _look.y -= 0.45 * p }
    _a.fromArray(c.from).sub(_look).multiplyScalar(pull)
    _b.fromArray(c.to).sub(_look).multiplyScalar(pull)
    _pos.lerpVectors(_a, _b, p).add(_look)
    let roll = 0
    if (name === 'selfie' || name === 'reveal') {
      // Handheld: a little sway and a phone-like tilt that settles.
      const hand = name === 'selfie' ? 1 : 1 - p
      _pos.x += Math.sin(t * 2.1) * 0.035 * hand
      _pos.y += Math.sin(t * 2.9 + 1) * 0.025 * hand
      roll = -0.045 * hand
    }
    camera.position.copy(_pos)
    const fov = c.fovTo ? c.fov + (c.fovTo - c.fov) * p : c.fov
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
    camera.lookAt(_look)
    if (roll) camera.rotateZ(roll)
  }

  // ── Visitor awareness in the selfie: the robot drifts its gaze toward
  // the pointer a little (centre on touch screens). ──
  const pointer = { x: 0, y: 0 }
  function onPointer(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }

  let raf = 0
  let disposed = false
  function dispose() {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onPointer)
    robot.dispose()
    owned.forEach(x => x.dispose())
    renderer.forceContextLoss()
    renderer.dispose()
    root.remove()
  }

  const SHOT_NAMES = Object.keys(SHOTS)
  // Everything driven by time: the cube's path, the robot's gaze and
  // reactions, and the camera. The first frame is drawn with it before
  // play(), so the intro starts on a ready picture.
  let happy = false, waved = false
  function pose(t, dt) {
    // Cube: slow drift and tumble; a quick spin as the robot notices it.
    const toSelfie = smooth(span(t, SHOTS.selfie - 0.1, SHOTS.selfie + 0.5))
    cubeBase.lerpVectors(CUBE_HOME, CUBE_SELFIE, toSelfie)
    // Portrait has room above rather than beside: lift it clear of the robot.
    if (portrait) { cubeBase.x *= 0.62; cubeBase.z *= 0.75; cubeBase.y += 0.6 * toSelfie }
    const react = bump(span(t, T.notice + 0.1, T.notice + 1.0))
    cube.position.set(
      cubeBase.x + Math.sin(t * 0.8) * 0.12,
      cubeBase.y + Math.sin(t * 1.3) * 0.08 + react * 0.18,
      cubeBase.z + Math.cos(t * 0.7) * 0.1
    )
    cube.rotation.x += dt * 0.25
    cube.rotation.y += dt * (0.35 + 3.2 * react)
    edgeMat.opacity = 0.75 + 0.25 * react
    cubeLight.intensity = 1.2 + 1.4 * react

    // Camera: whichever shot t falls in. Cut shots drift at an even pace;
    // the selfie and reveal ease.
    let i = SHOT_NAMES.length - 1
    while (i > 0 && t < SHOTS[SHOT_NAMES[i]]) i--
    const name = SHOT_NAMES[i]
    const end = i < SHOT_NAMES.length - 1 ? SHOTS[SHOT_NAMES[i + 1]] : T.end
    const p = span(t, SHOTS[name], end)
    placeCamera(name, name === 'selfie' || name === 'reveal' ? easeInOut(p) : p, t)

    // Gaze: follows the cube (lazily at first), then turns to the camera.
    const cubeYaw = Math.atan2(cube.position.x, cube.position.z)
    const cubePitch = -Math.atan2(cube.position.y, Math.hypot(cube.position.x, cube.position.z))
    const atCam = smooth(span(t, T.turn, T.turn + 0.35))
    const camYaw = Math.atan2(camera.position.x, camera.position.z)
    const aware = easeOut(span(t, T.turn + 0.6, T.turn + 1.2))
    const interest = t < T.notice ? 0.55 : 1
    const yaw = cubeYaw * interest * (1 - atCam) + (camYaw * 0.6 + pointer.x * 0.25 * aware) * atCam
    const pitch = cubePitch * 0.6 * interest * (1 - atCam) + pointer.y * 0.1 * aware * atCam
    expr.setLook(Math.max(-0.75, Math.min(0.75, yaw)), Math.max(-0.3, Math.min(0.3, pitch)))
    expr.setHover(t >= T.notice && t < T.notice + 0.7)
    if (!happy && t >= T.happy) { happy = true; expr.play('happy') }
    if (!waved && t >= T.wave) { waved = true; expr.play('welcome') }
    expr.update(dt)
  }

  resize()
  pose(0, 0)

  function play({ onReveal } = {}) {
    return new Promise((resolve) => {
      document.body.appendChild(root)
      const prevFocus = document.activeElement
      const html = document.documentElement
      const prevOverflow = html.style.overflow
      html.style.overflow = 'hidden'
      requestAnimationFrame(() => root.classList.add('is-in'))
      skip.focus({ preventScroll: true })

      let t = 0
      let last = performance.now()
      let titled = false
      let done = false

      function finish(skipped) {
        if (done) return
        done = true
        window.removeEventListener('keydown', onKey)
        // Set the page up underneath, then fade the intro away over it.
        try { onReveal?.() } catch (e) { console.error('intro reveal failed:', e) }
        html.style.overflow = prevOverflow
        root.classList.add('is-leaving')
        if (skipped) root.classList.add('is-skipped')
        const out = skipped ? 350 : 650
        setTimeout(() => {
          dispose()
          if (prevFocus && prevFocus !== document.body && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true })
          resolve()
        }, out)
      }
      function onKey(e) { if (e.key === 'Escape') finish(true) }
      skip.addEventListener('click', () => finish(true))
      window.addEventListener('keydown', onKey)
      window.addEventListener('resize', resize, { passive: true })
      window.addEventListener('pointermove', onPointer, { passive: true })

      function frame(now) {
        if (disposed) return
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        t += dt
        if (!titled && t >= T.title) { titled = true; title.classList.add('is-shown') }
        pose(t, dt)
        renderer.render(scene, camera)
        if (t >= T.end) finish(false)
        if (!disposed) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    })
  }

  renderer.render(scene, camera)
  return { play, dispose }
}
