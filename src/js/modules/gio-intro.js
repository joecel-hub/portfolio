import * as THREE from 'three'
import { loadRobot, createRobotInstance, addRobotLights } from './robot/model.js'
import { createExpressions } from './robot/expressions.js'

// Gio first-visit intro (about 9 s, then Enter; once per session; see
// intro-gate.js).
// A short opening title sequence, "meet the person behind the portfolio": the
// same robot-cube that later becomes the Stryg.Bytes assistant, in a quiet
// dark space with one floating cube.
//
//   1. wide      0–2 s    the robot floats, idly watching the cube drift nearby
//   2. closer    2–3.3    it notices the cube: eyes widen, a small happy hop
//   3. low side  3.3–4.3  a low three-quarter angle on robot and cube
//   4. selfie    4.3–5.6  it turns to the camera and waves
//   5. reveal    5.6–8.95 the camera rises; the cube floats away, the space
//                         warms toward the Gio violet, and GIO enters letter
//                         by letter (rise, a small hop, a damped swing, settle)
//                         while the robot glances down at it; an Enter
//                         button follows, and the scene holds on the title
//                         (the robot still idling) until it's pressed
//   6. out       ~1 s     after Enter: a gentle push-in as title and scene
//                         zoom and fade into the portfolio underneath
//
// There's no visible skip: the Enter button is the way in. Esc still leaves
// at any point, so keyboard users are never stuck.
//
// Shots 1–3 cut; 4–6 flow. Everything, the DOM title included, is driven by
// one clock, so frames are deterministic and never drift apart.
//
// prepareGioIntro() loads everything and resolves when it can play without
// a stall; main.js races it against a short timeout and falls back to the
// normal loader if it isn't ready (or throws). play() resolves once the
// intro has faded out and been disposed.

const BG = new THREE.Color(0x07080d)
const BG_WARM = new THREE.Color(0x0e0b1d) // where the reveal leaves the space
const VIOLET = new THREE.Color('#8b7eea') // Gio accent, lifted for a dark stage

// Seconds. Each shot runs from its start to the next one's.
const SHOTS = { wide: 0, closer: 2.0, low: 3.3, selfie: 4.3, reveal: 5.6 }
const T = {
  notice: 2.15, // eyes widen toward the cube
  happy: 2.3,   // small hop
  turn: 4.4,    // looks at the camera
  wave: 4.6,    // waves
  shift: 5.7,   // the space starts to change, the cube floats off
  logo: 6.6,    // first letter enters (the camera has risen by now)
  sub: 7.85,    // "IT Infrastructure · Web Development"
  enter: 8.35,  // the Enter button appears
  out: 8.95,    // the scene holds here until the visitor enters; then the
                // push-in, zoom and fade begin
  end: 9.3      // hand over to the page (then a 0.65 s fade)
}
const LETTER_GAP = 0.09 // stagger between G, I and O

// Camera per shot: start → end pose (position, look-at, fov; lookTo/fovTo
// when those move too). Landscape values; portrait pulls the camera back
// along the same line (placeCamera).
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
const easeIn = (p) => p * p * p
const bump = (p) => Math.sin(Math.PI * clamp01(p)) // 0 → 1 → 0
const smooth = (p) => p * p * (3 - 2 * p)

// One letter's entrance at local time x (s): rises from below with a trace
// of motion blur, overshoots into a small hop, lands, then rocks on its base
// in a quickly damped swing and settles. ~1.3 s; still afterwards.
function letterPose(x) {
  if (x <= 0) return { y: 44, rot: 0, scale: 0.82, opacity: 0, blur: 5 }
  let y
  if (x < 0.38) y = 44 - 58 * easeOut(x / 0.38)            // rise to -14
  else if (x < 0.6) y = -14 + 14 * ((x - 0.38) / 0.22) ** 2 // drop to 0
  else y = -3 * bump((x - 0.6) / 0.22)                      // a small rebound
  const s = x - 0.6 // swing starts on landing
  const rot = s > 0 ? -7 * Math.exp(-3.6 * s) * Math.sin(9 * s) : 0
  return {
    y,
    rot,
    scale: 0.82 + 0.18 * easeOut(clamp01(x / 0.45)),
    opacity: easeOut(clamp01(x / 0.3)),
    blur: 5 * (1 - clamp01(x / 0.32))
  }
}

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
      <span class="gi-mark" role="img" aria-label="GIO"><span class="gi-l" aria-hidden="true">G</span><span class="gi-l" aria-hidden="true">I</span><span class="gi-l" aria-hidden="true">O</span></span>
      <span class="gi-sub">IT Infrastructure <span aria-hidden="true">·</span> Web Development</span>
      <button type="button" class="gi-enter" aria-label="Enter the portfolio" tabindex="-1">Enter <span aria-hidden="true">→</span></button>
    </div>`
  const stage = root.querySelector('.gi-stage')
  const title = root.querySelector('.gi-title')
  const letters = [...root.querySelectorAll('.gi-l')]
  const sub = root.querySelector('.gi-sub')
  const enterBtn = root.querySelector('.gi-enter')

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
  const cubeMat = track(new THREE.MeshStandardMaterial({
    color: 0x1b2038, metalness: 0.5, roughness: 0.3, emissive: VIOLET, emissiveIntensity: 0.12, transparent: true
  }))
  cube.add(new THREE.Mesh(cubeGeo, cubeMat))
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
  // Camera for shot `name` at progress p (0..1); `push` (0..1) is the final
  // push-in toward the look-at point.
  function placeCamera(name, p, t, push = 0) {
    const c = CAM[name]
    _look.fromArray(c.look)
    if (c.lookTo) _look.lerp(_b.fromArray(c.lookTo), p)
    // Portrait: aim at the middle of robot + cube (too narrow to frame off
    // centre), and end the reveal with the robot higher up, clear of the title.
    if (portrait) { _look.x = -0.1; if (name === 'reveal') _look.y -= 0.45 * p }
    _a.fromArray(c.from).sub(_look).multiplyScalar(pull)
    _b.fromArray(c.to).sub(_look).multiplyScalar(pull)
    _pos.lerpVectors(_a, _b, p).multiplyScalar(1 - 0.22 * push).add(_look)
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

  // ── The title, on the same clock as the scene ──
  function poseTitle(t) {
    letters.forEach((el, i) => {
      const l = letterPose(t - T.logo - i * LETTER_GAP)
      el.style.opacity = l.opacity.toFixed(3)
      el.style.transform = `translateY(${l.y.toFixed(2)}px) rotate(${l.rot.toFixed(2)}deg) scale(${l.scale.toFixed(3)})`
      el.style.filter = l.blur > 0.05 ? `blur(${l.blur.toFixed(2)}px)` : ''
    })
    const s = easeOut(span(t, T.sub, T.sub + 0.7))
    sub.style.opacity = s.toFixed(3)
    sub.style.transform = `translateY(${(8 * (1 - s)).toFixed(2)}px)`
    sub.style.letterSpacing = `${(0.2 - 0.08 * s).toFixed(3)}em`
    // The Enter button rises in after the subtitle; clickable once shown.
    const e = easeOut(span(t, T.enter, T.enter + 0.6))
    enterBtn.style.opacity = e.toFixed(3)
    enterBtn.style.transform = `translateY(${(10 * (1 - e)).toFixed(2)}px)`
    const ready = e > 0.5
    if (ready !== enterBtn.classList.contains('is-ready')) {
      enterBtn.classList.toggle('is-ready', ready)
      enterBtn.tabIndex = ready ? 0 : -1
      if (ready) enterBtn.focus({ preventScroll: true })
    }
    // Once settled: a slow drift closer, then the zoom-and-fade hand-over.
    const settle = smooth(span(t, T.logo + 1.4, T.out))
    const out = easeIn(span(t, T.out, T.end + 0.65))
    title.style.transform = `translateX(-50%) scale(${(1 + 0.05 * settle + 0.22 * out).toFixed(4)})`
    title.style.opacity = (1 - out).toFixed(3)
  }

  const SHOT_NAMES = Object.keys(SHOTS)
  const _bg = new THREE.Color()
  // Everything driven by time: the cube's path, the space, the robot's gaze
  // and reactions, the camera and the title. The first frame is drawn with
  // it before play(), so the intro starts on a ready picture.
  let happy = false, waved = false, cheered = false
  function pose(t, dt) {
    // The space: warmer and a little brighter as GIO arrives; the floor
    // light gives way.
    const shift = smooth(span(t, T.shift, T.logo + 1.2))
    renderer.setClearColor(_bg.copy(BG).lerp(BG_WARM, shift), 1)
    backGlow.material.opacity = 1 + 0.9 * shift
    backGlow.scale.setScalar(1 + 0.25 * shift)
    pool.material.opacity = 1 - 0.65 * shift
    shadow.material.opacity = 1 - 0.4 * shift

    // Cube: slow drift and tumble; a quick spin as the robot notices it;
    // at the reveal it floats up and away, handing over to the title.
    const toSelfie = smooth(span(t, SHOTS.selfie - 0.1, SHOTS.selfie + 0.5))
    cubeBase.lerpVectors(CUBE_HOME, CUBE_SELFIE, toSelfie)
    // Portrait has room above rather than beside: lift it clear of the robot.
    if (portrait) { cubeBase.x *= 0.62; cubeBase.z *= 0.75; cubeBase.y += 0.6 * toSelfie }
    const leave = easeIn(span(t, T.shift, T.logo + 1.4))
    const react = bump(span(t, T.notice + 0.1, T.notice + 1.0))
    cube.position.set(
      cubeBase.x + Math.sin(t * 0.8) * 0.12 - 0.4 * leave,
      cubeBase.y + Math.sin(t * 1.3) * 0.08 + react * 0.18 + 2.4 * leave,
      cubeBase.z + Math.cos(t * 0.7) * 0.1 - 1.2 * leave
    )
    cube.rotation.x += dt * 0.25
    cube.rotation.y += dt * (0.35 + 3.2 * react + 1.2 * leave)
    const fade = 1 - leave
    cubeMat.opacity = fade
    edgeMat.opacity = (0.75 + 0.25 * react) * fade
    cubeLight.intensity = (1.2 + 1.4 * react) * fade
    cube.visible = fade > 0.01

    // Camera: whichever shot t falls in (the reveal holds its last pose
    // through the title), plus the final push-in. Cut shots drift at an
    // even pace; the selfie and reveal ease.
    let i = SHOT_NAMES.length - 1
    while (i > 0 && t < SHOTS[SHOT_NAMES[i]]) i--
    const name = SHOT_NAMES[i]
    const end = i < SHOT_NAMES.length - 1 ? SHOTS[SHOT_NAMES[i + 1]] : SHOTS.reveal + 1.4
    const p = span(t, SHOTS[name], end)
    const push = easeIn(span(t, T.out, T.end + 0.65))
    placeCamera(name, name === 'selfie' || name === 'reveal' ? easeInOut(p) : p, t, push)

    // Gaze: follows the cube (lazily at first), turns to the camera, then
    // glances down as GIO lands below it.
    const cubeYaw = Math.atan2(cube.position.x, cube.position.z)
    const cubePitch = -Math.atan2(cube.position.y, Math.hypot(cube.position.x, cube.position.z))
    const atCam = smooth(span(t, T.turn, T.turn + 0.35))
    const camYaw = Math.atan2(camera.position.x, camera.position.z)
    const aware = easeOut(span(t, T.turn + 0.6, T.turn + 1.2))
    const interest = t < T.notice ? 0.55 : 1
    const watchTitle = bump(span(t, T.logo - 0.1, T.logo + 1.7))
    const yaw = cubeYaw * interest * (1 - atCam) + (camYaw * 0.6 + pointer.x * 0.25 * aware) * atCam
    const pitch = cubePitch * 0.6 * interest * (1 - atCam) + pointer.y * 0.1 * aware * atCam + 0.26 * watchTitle
    expr.setLook(Math.max(-0.75, Math.min(0.75, yaw)), Math.max(-0.3, Math.min(0.3, pitch)))
    expr.setHover(t >= T.notice && t < T.notice + 0.7)
    if (!happy && t >= T.happy) { happy = true; expr.play('happy') }
    if (!waved && t >= T.wave) { waved = true; expr.play('welcome') }
    // A little cheer when the last letter lands.
    if (!cheered && t >= T.logo + 2 * LETTER_GAP + 0.6) { cheered = true; expr.play('happy') }
    expr.update(dt)

    poseTitle(t)
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
      // Focus the dialog itself until the Enter button appears (it then
      // takes focus); Esc works from the start.
      root.tabIndex = -1
      root.focus({ preventScroll: true })

      let t = 0 // timeline time: it holds at T.out until the visitor enters
      let last = performance.now()
      let done = false
      let entered = false

      // Enter: from the hold (or on the way to it) straight into the exit.
      function enter() {
        if (entered || !enterBtn.classList.contains('is-ready')) return
        entered = true
        t = Math.max(t, T.out)
      }

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
      // Esc: a quiet way out at any time (for keyboard users; there is no
      // visible skip). Enter: same as the button once it's shown.
      function onKey(e) {
        if (e.key === 'Escape') finish(true)
        else if (e.key === 'Enter' && e.target !== enterBtn) enter()
      }
      enterBtn.addEventListener('click', enter)
      window.addEventListener('keydown', onKey)
      window.addEventListener('resize', resize, { passive: true })
      window.addEventListener('pointermove', onPointer, { passive: true })

      function frame(now) {
        if (disposed) return
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now
        // Waiting at the title: the timeline holds, but the robot (real
        // dt) keeps idling and following the cursor.
        t = entered || t < T.out ? t + dt : T.out
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
