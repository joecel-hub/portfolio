import * as THREE from 'three'
import { loadRobot, createRobotInstance, addRobotLights } from './robot/model.js'
import { createExpressions } from './robot/expressions.js'

// Gio first-visit intro (about 4 s, once per session; see intro-gate.js).
// The same robot-cube mascot as the lab floats in a dark, quiet space, wakes
// up, notices the visitor, the camera moves in, and GIO appears before the
// page is revealed. Three supporting objects each stand for a side of the
// work: a wireframe cube (building), a thin ring (networks) and a few linked
// nodes (infrastructure). Minimal on purpose: the robot is the focus.
//
// prepareGioIntro() loads everything and resolves when it can play without
// a stall; main.js races it against a short timeout and falls back to the
// normal loader if it isn't ready (or throws). play() resolves once the
// intro has faded out and been disposed.

const BG = 0x07080d
const VIOLET = new THREE.Color('#8b7eea') // Gio accent, lifted for a dark stage
const BLUE = new THREE.Color('#1597d4')   // the robot's own blue
const TEAL = new THREE.Color('#2fb4cc')

// Timeline (seconds)
const T = {
  objects: [0.3, 1.2], // supporting objects fade in
  wake: [1.3, 1.9],    // eyes open, glow up
  react: 1.9,          // objects respond to the robot waking
  dolly: [2.0, 3.6],   // camera moves in
  title: 2.7,          // GIO + line fade in
  end: 4.2             // reveal the page
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const span = (t, [a, b]) => clamp01((t - a) / (b - a))
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const easeOut = (p) => 1 - Math.pow(1 - p, 3)
const bump = (p) => Math.sin(Math.PI * clamp01(p)) // 0 → 1 → 0

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
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  addRobotLights(scene)

  const robot = createRobotInstance(loaded)
  robot.idle?.play()
  const expr = createExpressions(robot, { glitch: false })
  scene.add(robot.model)

  // ── Supporting objects ──
  const owned = [] // geometries/materials to dispose
  const track = (...xs) => { owned.push(...xs); return xs[0] }

  // Building: a wireframe cube, upper left.
  const cubeMat = track(new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0 }))
  const cube = new THREE.LineSegments(track(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.55, 0.55, 0.55))), cubeMat)
  cube.rotation.set(0.5, 0.6, 0.1) // placed by resize()
  scene.add(cube)

  // Networks: a thin ring around the robot.
  const ringMat = track(new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0 }))
  const ring = new THREE.Mesh(track(new THREE.TorusGeometry(2.7, 0.012, 6, 180)), ringMat)
  const RING_TILT = Math.PI / 2.35
  ring.rotation.set(RING_TILT, 0, 0.2)
  scene.add(ring)

  // Infrastructure: five nodes and their links, right side.
  const nodePos = [
    [2.5, -0.2, -0.4], [3.1, 0.5, -1.0], [2.7, 1.15, -0.3], [3.5, -0.6, -1.2], [2.2, 0.8, -1.4]
  ].map(p => new THREE.Vector3(...p))
  const links = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4]]
  const nodeMat = track(new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0 }))
  const nodes = new THREE.InstancedMesh(track(new THREE.SphereGeometry(0.05, 12, 12)), nodeMat, nodePos.length)
  // Its bounds are computed before the instances are placed; five tiny
  // spheres aren't worth culling, so never cull them by mistake.
  nodes.frustumCulled = false
  const linkGeo = track(new THREE.BufferGeometry().setFromPoints(links.flatMap(([a, b]) => [nodePos[a], nodePos[b]])))
  const linkMat = track(new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0 }))
  const net = new THREE.Group()
  net.add(nodes, new THREE.LineSegments(linkGeo, linkMat))
  scene.add(net)
  const dummy = new THREE.Object3D()

  // ── Camera framing: slightly above, like the lab hero's three-quarter
  // view. Wide screens spread the objects left/right of the robot; tall
  // (portrait) screens stack them above/below and tighten the ring, so the
  // camera can stay close enough for the robot to read on a phone. ──
  const CAM_Y = 1.5
  const LOOK_Y = -0.35 // robot sits a little above centre, clear of the title
  const TAN = Math.tan(THREE.MathUtils.degToRad(32 / 2))
  let camFrom = 12, camTo = 9
  function resize() {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const portrait = camera.aspect < 0.9
    ring.scale.setScalar(portrait ? 0.62 : 1)
    if (portrait) {
      // Both above the robot (cube left, network right): the lower third
      // belongs to the title.
      cube.position.set(-1.15, 2.35, -0.6)
      net.position.set(-2.05, 1.55, 0.2)
      net.scale.setScalar(0.8)
    } else {
      cube.position.set(-2.9, 1.1, -0.8)
      net.position.set(0, 0, 0)
      net.scale.setScalar(1)
    }
    // Distance at which the composition's width (world units) fits.
    const needWidth = portrait ? 4.5 : 7.6
    camFrom = Math.max(12, needWidth / (2 * TAN * camera.aspect))
    camTo = camFrom * (portrait ? 0.86 : 0.76)
  }

  // ── Visitor awareness: the robot looks toward the pointer once awake ──
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
    nodes.dispose()
    renderer.forceContextLoss()
    renderer.dispose()
    root.remove()
  }

  // Draw one frame now, so play() starts on a ready picture.
  resize()
  camera.position.set(0, CAM_Y, camFrom)
  camera.lookAt(0, LOOK_Y, 0)

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
      let happy = false
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

        const objects = easeOut(span(t, T.objects))
        const open = t < T.wake[0] ? 0.06 : 0.06 + 0.94 * easeOut(span(t, T.wake))
        if (!happy && t >= T.wake[0] + 0.25) { happy = true; expr.play('happy') }
        if (!titled && t >= T.title) { titled = true; title.classList.add('is-shown') }

        // Looks at the visitor once awake (gentle; centre on touch screens).
        const aware = easeOut(span(t, [T.wake[0] + 0.3, T.wake[1] + 0.3]))
        expr.setLook(pointer.x * 0.35 * aware, pointer.y * 0.14 * aware)
        expr.update(dt)
        // Asleep → awake: eyes and glow scale with `open` (after expr.update,
        // which resets them from the clips each frame).
        robot.eyes.forEach(e => { e.scale.y *= open })
        robot.eyeMat.color.multiplyScalar(0.2 + 0.8 * open)
        robot.haloMat.opacity *= open

        // Objects: drift, then a small response as the robot wakes.
        const r = t - T.react
        cube.rotation.x += dt * 0.12
        cube.rotation.y += dt * (0.18 + 0.9 * bump(r / 0.9))
        ring.rotation.z += dt * 0.08
        ring.rotation.x = RING_TILT + 0.22 * bump(r / 0.9)
        nodePos.forEach((p, i) => {
          dummy.position.copy(p)
          dummy.position.y += Math.sin(t * 0.9 + i) * 0.03
          dummy.scale.setScalar(1 + 0.7 * bump((r - i * 0.08) / 0.5))
          dummy.updateMatrix()
          nodes.setMatrixAt(i, dummy.matrix)
        })
        nodes.instanceMatrix.needsUpdate = true
        cubeMat.opacity = objects * 0.75
        ringMat.opacity = objects * 0.5
        nodeMat.opacity = objects
        linkMat.opacity = objects * 0.35

        // Camera moves in toward the robot.
        const d = easeInOut(span(t, T.dolly))
        camera.position.set(0, CAM_Y - 0.3 * d, camFrom + (camTo - camFrom) * d)
        camera.lookAt(0, LOOK_Y, 0)

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
