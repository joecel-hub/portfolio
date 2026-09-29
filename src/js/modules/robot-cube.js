import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { loadRobot, createRobotInstance, addRobotLights, haloTexture } from './robot/model.js'
import { createExpressions } from './robot/expressions.js'

// The Stryg.Bytes robot-cube logo as a live 3D mascot for the lab hero.
// The model and its "Intro"/"Idle" clips are made in Blender
// (src/assets/models/robot-cube.glb, via robot/model.js). A built-in copy made from primitives (dark
// cube seen corner-on, glowing eyes, blue "book" flaps, orange corners, white
// whisker marks, a listening slot on top) is the fallback if the file fails.
// The canvas fills the whole hero: the robot is placed on the layout's
// .hero-bot-card anchor, with a field of small cubes floating around it.
// Same API as before: initHeroBot(container) → { setPaused, destroy }.
export function initHeroBot(container, options = {}) {
  if (!container) return null

  const {
    leftColor = '#10231e',
    rightColor = '#102652',
    blue = '#1597d4',
    orange = '#ff8a3d',
    modelUrl, // default: the bundled robot-cube.glb
    anchor = document.querySelector('.hero-bot-card'),
    pointerTarget = document.getElementById('hero') || container,
    // Called each time the drop-in Intro finishes (first visit and every
    // return to the lab): the assistant's cue to say hello.
    onIntroEnd = null
  } = options

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let width = container.clientWidth || 1
  let height = container.clientHeight || 1
  let paused = false
  let raf = null
  let destroyed = false
  let hovering = false
  let offscreen = false

  const targetLook = { x: 0, y: 0 }
  const currentLook = { x: 0, y: 0 }
  const clock = new THREE.Clock()
  // Scene time, advanced only while the loop runs (pausing doesn't rewind it).
  let elapsed = 0

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100)
  camera.position.set(0, 1.8, 5.5)
  camera.lookAt(0, -0.1, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setSize(width, height)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // No post-processing: bloom can't glow on a transparent canvas anyway (the
  // eye halos carry the glow), so tone-map in the renderer and save a pass.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  container.appendChild(renderer.domElement)


  // ── Lighting ── glow hierarchy comes from the emissive eyes/slot.
  addRobotLights(scene, { blue, orange })

  // The cube is seen corner-on like the logo: local +Z is the left face,
  // local +X the right face, and (S, y, S) the front edge.
  const S = 0.8 // half size
  const BASE_YAW = -Math.PI / 4
  // The stage is positioned/scaled onto the layout anchor (see place()).
  const stage = new THREE.Group()
  scene.add(stage)
  const bot = new THREE.Group()
  bot.rotation.y = BASE_YAW
  stage.add(bot)

  // ── Body: rounded cube, left/right/top shaded like the logo's gradient ──
  const bodyGeo = new RoundedBoxGeometry(S * 2, S * 2, S * 2, 4, 0.07)
  {
    const n = bodyGeo.attributes.normal
    const colors = new Float32Array(n.count * 3)
    const cl = new THREE.Color(leftColor)
    const cr = new THREE.Color(rightColor)
    const ct = cl.clone().lerp(cr, 0.5)
    for (let i = 0; i < n.count; i++) {
      const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i)
      const c = ny > 0.6 ? ct : (Math.abs(nx) > Math.abs(nz) ? cr : cl)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    bodyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.38, metalness: 0.15, clearcoat: 0.5, clearcoatRoughness: 0.3
  }))
  bot.add(body)

  // Decals are flat shapes, and the left set is mirrored — render both sides.
  const blueMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(blue), emissive: new THREE.Color(blue), emissiveIntensity: 0.35,
    roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide
  })
  const orangeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(orange), emissive: new THREE.Color(orange), emissiveIntensity: 0.25,
    roughness: 0.4, side: THREE.DoubleSide
  })

  // ── Blue top trim along the four top edges ──
  const trimT = 0.035
  for (const [w, d, x, z] of [[S * 2, trimT, 0, S], [S * 2, trimT, 0, -S], [trimT, S * 2, S, 0], [trimT, S * 2, -S, 0]]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + trimT, trimT, d + trimT), blueMat)
    trim.position.set(x, S - 0.01, z)
    bot.add(trim)
  }

  // ── Side decals: blue "book" band + orange corner, one set per front face.
  // Drawn in face coordinates: x = u runs from the front edge (0) to the
  // outer edge (2S), y = v is height. Each set hangs off a pivot on the
  // front edge; scaling the pivot's x unfolds it outward during the intro.
  const OFF = 0.012
  function faceShape(start, segments) {
    const s = new THREE.Shape()
    s.moveTo(start[0], start[1])
    for (const seg of segments) {
      if (seg.length === 4) s.quadraticCurveTo(seg[0], seg[1], seg[2], seg[3])
      else s.lineTo(seg[0], seg[1])
    }
    s.closePath()
    return s
  }
  const bandShape = faceShape([0, -S - 0.07], [
    [S, -S - 0.1, S * 2 + 0.09, -S + 0.2], // curved lower edge, front → outer
    [S * 2 + 0.09, S - 0.02],               // up the outer edge
    [S * 2, S - 0.02],
    [S * 2, -S + 0.3],                      // back down, inside the outer edge
    [S, -S + 0.1, 0.03, -S + 0.02]          // inner curve back to the front edge
  ])
  const cornerShape = faceShape([S * 2 - 0.005, -S + 0.62], [
    [S * 2 - 0.005, -S + 0.3],
    [S * 1.15, -S + 0.13]
  ])
  const bandGeo = new THREE.ShapeGeometry(bandShape, 24)
  const cornerGeo = new THREE.ShapeGeometry(cornerShape)

  const flapPivots = []
  function addFaceDecals(pivot) {
    const corner = new THREE.Mesh(cornerGeo, orangeMat)
    corner.position.z = OFF * 0.5
    const band = new THREE.Mesh(bandGeo, blueMat)
    band.position.z = OFF
    pivot.add(corner, band)
    flapPivots.push(pivot)
    bot.add(pivot)
  }
  // Left face (+Z plane), u grows toward −X. Mirror via scale.z = −1 then a
  // half turn (net: x → −x, normal stays +Z) so scale.x is free for unfolding.
  const leftPivot = new THREE.Group()
  leftPivot.position.set(S, 0, S + OFF)
  leftPivot.rotation.y = Math.PI
  leftPivot.scale.z = -1
  addFaceDecals(leftPivot)
  // Right face (+X plane), u grows toward −Z: a quarter turn maps x → −z.
  const rightPivot = new THREE.Group()
  rightPivot.position.set(S + OFF, 0, S)
  rightPivot.rotation.y = Math.PI / 2
  addFaceDecals(rightPivot)

  // ── Eyes: glowing white ovals, one per front face near the front edge.
  // Unlit and over-bright so they tone-map to pure white. The glow is a
  // halo sprite behind each eye: the canvas is transparent, so bloom alone
  // would spill onto alpha-0 pixels and never show.
  const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4) })
  const eyeGeo = new THREE.CircleGeometry(0.15, 40)
  const EYE_Y = 1.3
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(S - 0.52, -0.02, S + OFF * 2)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(S + OFF * 2, -0.02, S - 0.52)
  eyeR.rotation.y = Math.PI / 2
  const eyes = [eyeL, eyeR]
  eyes.forEach(e => { e.scale.set(1, EYE_Y, 1); bot.add(e) })

  const haloMat = new THREE.MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false })
  const halos = eyes.map(e => {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.72), haloMat)
    h.position.copy(e.position)
    h.rotation.copy(e.rotation)
    h.renderOrder = -1
    bot.add(h)
    return h
  })

  // ── Whisker marks: thin white bars toward each outer edge ──
  const whiskerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.2, roughness: 0.4, side: THREE.DoubleSide
  })
  const whiskers = []
  const whiskerBaseY = []
  const whiskerSpec = [[0, 0.62, 0.022], [0.035, 0.5, 0.014], [0.065, 0.56, 0.018], [0.095, 0.42, 0.012]]
  for (const [du, h, w] of whiskerSpec) {
    const u = S * 2 - 0.42 + du
    const geo = new THREE.PlaneGeometry(w, h)
    const l = new THREE.Mesh(geo, whiskerMat)
    l.position.set(S - u, 0.18, S + OFF * 2)
    const r = new THREE.Mesh(geo, whiskerMat)
    r.position.set(S + OFF * 2, 0.18, S - u)
    r.rotation.y = Math.PI / 2
    bot.add(l, r)
    whiskers.push(l, r)
    whiskerBaseY.push(0.18, 0.18)
  }

  // ── Listening slot on the top face (toward the back corner). Stretched
  // along the diagonal that faces the camera, so it reads as the logo's oval.
  const slotMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.3
  })
  const slot = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.2, 48), slotMat)
  slot.rotation.set(-Math.PI / 2, 0, Math.PI / 4)
  slot.scale.set(1.25, 1, 1)
  slot.position.set(-0.28, S + 0.004, -0.28)
  const grille = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), new THREE.MeshBasicMaterial({ color: 0x0b1424 }))
  grille.rotation.copy(slot.rotation)
  grille.scale.copy(slot.scale)
  grille.position.set(-0.28, S + 0.003, -0.28)
  bot.add(slot, grille)

  // ── Soft contact shadow ──
  const shadowTex = (() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(0,0,0,0.5)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  })()
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(0, -S - 0.32, 0)
  stage.add(shadow)

  // ── Blender model ── The built-in cube above stays hidden unless the GLB
  // can't load. Visitor-driven motion (cursor look, hover, whisker glitch,
  // glow) is applied in code on top of the model's own clips.
  bot.traverse(o => { if (o.material) o.material.fog = false })
  bot.visible = false
  // glb = { robot, expr, introPending } once the shared model is ready.
  let glb = null
  loadRobot(modelUrl).then((loaded) => {
    if (destroyed) return
    const robot = createRobotInstance(loaded, { reduceMotion })
    const expr = createExpressions(robot, { reduceMotion })
    // Intro is played from updateGlb once the page loader has cleared.
    if (robot.intro) robot.model.visible = false
    else robot.idle?.play()
    stage.add(robot.model)
    glb = { robot, expr, introPending: !!robot.intro }
    wake()
  }, (err) => {
    if (destroyed) return
    console.warn('robot-cube: model failed to load, using the built-in cube', err)
    bot.visible = true
    introT = reduceMotion ? INTRO : 0
    wake()
  })

  // ── Cube field ── small cubes floating at different depths around the robot:
  // one InstancedMesh (solid) + one merged LineSegments (outlines) = 2 draws.
  scene.fog = new THREE.FogExp2(0x050508, 0.075) // far cubes fade into the page
  const lowEnd = window.matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4
  const field = buildCubeField(lowEnd ? 26 : 55, lowEnd ? 6 : 10)
  scene.add(field.group)
  let fieldFade = reduceMotion ? 1 : 0
  const parallax = { x: 0, y: 0 }
  const targetParallax = { x: 0, y: 0 }

  function buildCubeField(solidCount, outlineCount) {
    let seed = 0x1597d4 // seeded: the same arrangement on every visit
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const navy = [new THREE.Color('#132b3f'), new THREE.Color('#16315e')]
    const accents = [new THREE.Color(blue), new THREE.Color(orange)]
    const group = new THREE.Group()
    const cubes = []
    const total = solidCount + outlineCount
    for (let i = 0; i < total; i++) {
      const outline = i >= solidCount
      const roll = rnd()
      cubes.push({
        outline,
        // Screen-space spread (NDC, a little past the edges) + depth, so the
        // field fills any aspect ratio; world positions come from layout().
        nx: rnd() * 2.3 - 1.15,
        ny: rnd() * 2.3 - 1.15,
        z: -7 + rnd() * 8.2,
        size: 0.06 * Math.pow(0.32 / 0.06, rnd()),
        rot: new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28),
        spin: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.5),
        phase: rnd() * 6.28,
        bob: 0.04 + rnd() * 0.1,
        color: outline ? accents[roll < 0.5 ? 0 : 1] : roll < 0.7 ? navy[i % 2] : accents[roll < 0.85 ? 0 : 1],
        base: new THREE.Vector3(),
        scale: 1
      })
    }
    const solids = cubes.filter(c => !c.outline)
    const outlines = cubes.filter(c => c.outline)

    const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.2, transparent: true, opacity: 0 })
    const mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.12), mat, solids.length)
    solids.forEach((c, i) => mesh.setColorAt(i, c.color))
    group.add(mesh)

    // Outline cubes: 12 edges each, transformed on the CPU into one buffer.
    const edge = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)).attributes.position
    const linePos = new Float32Array(outlines.length * edge.count * 3)
    const lineCol = new Float32Array(outlines.length * edge.count * 3)
    outlines.forEach((c, k) => { for (let v = 0; v < edge.count; v++) lineCol.set([c.color.r, c.color.g, c.color.b], (k * edge.count + v) * 3) })
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3))
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 })
    const lines = new THREE.LineSegments(lineGeo, lineMat)
    lines.frustumCulled = false
    group.add(lines)

    const dummy = new THREE.Object3D()
    const v = new THREE.Vector3()
    function pose(c, t) {
      dummy.position.copy(c.base)
      dummy.position.y += reduceMotion ? 0 : Math.sin(t * 0.6 + c.phase) * c.bob
      dummy.rotation.set(
        c.rot.x + (reduceMotion ? 0 : c.spin.x * t),
        c.rot.y + (reduceMotion ? 0 : c.spin.y * t),
        c.rot.z + (reduceMotion ? 0 : c.spin.z * t))
      dummy.scale.setScalar(c.size * c.scale)
      dummy.updateMatrix()
      return dummy.matrix
    }
    function update(t, fade) {
      solids.forEach((c, i) => mesh.setMatrixAt(i, pose(c, t)))
      mesh.instanceMatrix.needsUpdate = true
      outlines.forEach((c, k) => {
        const m = pose(c, t)
        for (let e = 0; e < edge.count; e++) {
          v.fromBufferAttribute(edge, e).applyMatrix4(m)
          linePos.set([v.x, v.y, v.z], (k * edge.count + e) * 3)
        }
      })
      lineGeo.attributes.position.needsUpdate = true
      mat.opacity = fade
      lineMat.opacity = fade * 0.55
    }
    function dispose() {
      mesh.geometry.dispose(); mat.dispose(); mesh.dispose()
      lineGeo.dispose(); lineMat.dispose()
    }
    return { group, cubes, update, dispose }
  }

  // Screen point (NDC) at world depth z → world position.
  const _p = new THREE.Vector3(), _d = new THREE.Vector3()
  function worldAt(nx, ny, z, out) {
    _p.set(nx, ny, 0.5).unproject(camera)
    _d.copy(_p).sub(camera.position).normalize()
    return out.copy(camera.position).addScaledVector(_d, (z - camera.position.z) / _d.z)
  }

  // Put the robot on its layout anchor, sized to about 80% of the anchor, then
  // lay the cube field out around it (clear of the robot, quieter behind text).
  const ROBOT_HEIGHT = 2.3 // world height of the model incl. flaps and tilt
  const robotNdc = new THREE.Vector2(0.45, 0)
  const robotNdcR = new THREE.Vector2(0.3, 0.5) // on-screen half-size of the robot, in NDC
  function place() {
    const c = container.getBoundingClientRect()
    const a = anchor && anchor.getBoundingClientRect()
    if (!c.width || !c.height || !a || !a.width) return
    camera.updateMatrixWorld()
    robotNdc.set(((a.left + a.width / 2 - c.left) / c.width) * 2 - 1, -(((a.top + a.height / 2 - c.top) / c.height) * 2 - 1))
    robotNdcR.set(a.width / c.width, a.height / c.height)
    worldAt(robotNdc.x, robotNdc.y, 0, stage.position)
    const dist = camera.position.distanceTo(stage.position)
    const visibleH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    stage.scale.setScalar((visibleH * (Math.min(a.width, a.height) / c.height) * 0.8) / ROBOT_HEIGHT)
  }
  function layout() {
    place()
    // Where the text is: left of the robot on desktop, below it when stacked.
    const stacked = robotNdc.x < 0.2
    const inText = (c) => stacked
      ? c.ny < robotNdc.y - robotNdcR.y * 0.9
      : c.nx < robotNdc.x - 0.35
    const narrow = camera.aspect < 1
    for (const c of field.cubes) {
      let z = narrow ? Math.min(c.z, -1.5) : c.z // phones: nothing right up close
      c.scale = 1
      // Behind the text: push back and shrink so it stays readable.
      if (inText(c) && z > -3.5) { z -= 3.5; c.scale = 0.6 }
      // Never over the robot on screen (in front of it or level with it):
      // send those well behind it so its silhouette stays clean.
      const ex = (c.nx - robotNdc.x) / (robotNdcR.x * 1.15)
      const ey = (c.ny - robotNdc.y) / (robotNdcR.y * 1.15)
      if (ex * ex + ey * ey < 1 && z > -2.5) z -= 5
      worldAt(c.nx, c.ny, z, c.base)
    }
    field.update(elapsed, fieldFade)
  }

  // The grid loader removes body.loader-done while it covers the page.
  const stageReady = () => document.body.classList.contains('loader-done')

  // ── Timers ──
  const INTRO = 1.3
  let introT = reduceMotion ? INTRO : 0
  let blinkTimer = reduceMotion ? Infinity : 2.6 + Math.random() * 2.4
  let blinking = false
  let blinkT = 0
  let glitchTimer = reduceMotion ? Infinity : 4 + Math.random() * 3
  let glitchT = -1
  let eyeWiden = 1

  const easeOutBack = (p) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2)
  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3)
  const clamp01 = (v) => Math.max(0, Math.min(1, v))

  function resize() {
    // Hidden (display:none) containers measure 0×0 — keep the last size.
    if (!container.clientWidth || !container.clientHeight) return
    width = container.clientWidth
    height = container.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    layout()
    wake()
  }

  // Reduced motion holds a static pose, so the loop sleeps once the cube has
  // settled and only wakes for pointer/resize changes (no 60fps idle renders).
  function settled() {
    return Math.abs(targetLook.x - currentLook.x) < 0.0005 &&
      Math.abs(targetLook.y - currentLook.y) < 0.0005 &&
      Math.abs((hovering ? 1.12 : 1) - eyeWiden) < 0.0005 &&
      Math.abs(targetParallax.x - parallax.x) < 0.0005 &&
      Math.abs(targetParallax.y - parallax.y) < 0.0005 &&
      !(glb && glb.expr.busy())
  }
  const active = () => !paused && !offscreen && !destroyed
  function wake() {
    if (reduceMotion && active()) start()
  }
  // One place decides whether the loop runs: mode switch (setPaused) and
  // scrolling the hero out of view (IntersectionObserver) both land here.
  function sync() {
    if (active()) { resize(); start() } else stop()
  }

  function onPointerMove(e) {
    const hero = pointerTarget.getBoundingClientRect()
    const a = (anchor || container).getBoundingClientRect()
    const clamp1 = (v) => Math.max(-1, Math.min(1, v))
    // Look is relative to the robot; parallax is relative to the whole hero.
    targetLook.x = clamp1((e.clientX - (a.left + a.width / 2)) / (hero.width / 2)) * 0.4
    targetLook.y = clamp1((e.clientY - (a.top + a.height / 2)) / (hero.height / 2)) * 0.16
    targetParallax.x = clamp1(((e.clientX - hero.left) / hero.width) * 2 - 1)
    targetParallax.y = clamp1(((e.clientY - hero.top) / hero.height) * 2 - 1)
    hovering = e.clientX >= a.left && e.clientX <= a.right && e.clientY >= a.top && e.clientY <= a.bottom
    wake()
  }
  function onPointerLeave() {
    targetLook.x = targetLook.y = 0
    targetParallax.x = targetParallax.y = 0
    hovering = false
    wake()
  }

  // Whisker glitch: a short flicker every few seconds (either model).
  function glitch(dt, list, baseY) {
    if (reduceMotion) return
    glitchTimer -= dt
    if (glitchTimer <= 0 && glitchT < 0) glitchT = 0
    if (glitchT < 0) return
    glitchT += dt
    const on = glitchT < 0.2
    list.forEach((w, i) => {
      w.visible = !on || Math.random() > 0.35
      w.position.y = baseY[i] + (on ? (Math.random() - 0.5) * 0.03 * (i % 2 ? 1 : -1) : 0)
    })
    if (!on) { glitchT = -1; glitchTimer = 4 + Math.random() * 3 }
  }

  function updateGlb(dt) {
    const g = glb
    // Hold the Intro (model hidden) until the page loader has cleared, so the
    // drop-in is actually seen.
    if (g.introPending) {
      if (!stageReady()) return
      g.introPending = false
      g.robot.model.visible = true
      g.robot.playIntro()
      g.introRunning = true
    }
    // A look set by the assistant (e.g. toward a project card) wins over
    // the cursor while it lasts.
    if (lookOverride && lookOverride.until > elapsed) g.expr.setLook(lookOverride.x, lookOverride.y)
    else g.expr.setLook(targetLook.x, targetLook.y)
    g.expr.setHover(hovering)
    g.expr.update(dt)
    if (g.introRunning && !g.robot.introRunning()) {
      g.introRunning = false
      g.expr.play('welcome') // happy eyes + a wave of the flaps
      try { onIntroEnd?.() } catch (e) { console.error('onIntroEnd failed:', e) }
    }
  }

  // ── Assistant hooks (no-ops until the model has loaded) ──
  let lookOverride = null
  function react(name) {
    if (!glb) return
    glb.expr.play(name)
    wake()
  }
  function setMood(mood) {
    if (!glb) return
    glb.expr.setMood(mood)
    wake()
  }
  // Look toward a screen point for `seconds`, then back to the cursor.
  function lookAtPoint(clientX, clientY, seconds = 1.6) {
    const a = (anchor || container).getBoundingClientRect()
    const clamp1 = (v) => Math.max(-1, Math.min(1, v))
    lookOverride = {
      x: clamp1((clientX - (a.left + a.width / 2)) / (window.innerWidth / 2)) * 0.45,
      y: clamp1((clientY - (a.top + a.height / 2)) / (window.innerHeight / 2)) * 0.2,
      until: elapsed + seconds
    }
    wake()
  }
  // Replay the drop-in (on each return to the lab). It waits, hidden, for
  // the Stryg.Bytes loader to clear, like the first time.
  function replayIntro() {
    if (!glb || !glb.robot.intro || reduceMotion) return
    glb.robot.model.visible = false
    glb.introPending = true
  }
  const isShowing = () => active() && !!glb && glb.robot.model.visible
  // Whether a drop-in will play (and onIntroEnd follow) on this device.
  const hasIntro = () => !!glb && !!glb.robot.intro

  function updateProcedural(dt, t) {
    // Intro: drop in and settle, flaps unfold, then the eyes open. It waits
    // (hidden) until the page loader has cleared.
    if (introT === 0 && !stageReady()) { bot.scale.setScalar(0.0001); return }
    bot.scale.setScalar(1)
    if (introT < INTRO) introT = Math.min(INTRO, introT + dt)
    const p = introT / INTRO
    const drop = easeOutBack(clamp01(p / 0.7))
    const unfold = easeOutCubic(clamp01((p - 0.35) / 0.45))
    const eyesOpen = easeOutCubic(clamp01((p - 0.75) / 0.25))

    const float = reduceMotion ? 0 : Math.sin(t * 1.1) * 0.06
    bot.position.y = (1 - drop) * 1.6 + float
    bot.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.015

    bot.rotation.y = BASE_YAW + currentLook.x
    bot.rotation.x = currentLook.y

    // Flaps: unfold on intro, open a touch more on hover.
    const flapOpen = Math.max(0.001, unfold) * (hovering ? 1.04 : 1)
    flapPivots.forEach(pv => { pv.scale.x = flapOpen })

    // Blink (after the intro).
    let lid = 1
    if (!reduceMotion && p >= 1) {
      blinkTimer -= dt
      if (blinkTimer <= 0 && !blinking) { blinking = true; blinkT = 0 }
      if (blinking) {
        blinkT += dt
        const closeDur = 0.07, openDur = 0.1
        if (blinkT < closeDur) lid = 1 - blinkT / closeDur
        else if (blinkT < closeDur + openDur) lid = (blinkT - closeDur) / openDur
        else { blinking = false; blinkTimer = 2.6 + Math.random() * 2.8 }
      }
    }
    const eyeY = EYE_Y * eyeWiden * Math.max(0.05, lid * eyesOpen)
    eyes.forEach(e => e.scale.set(eyeWiden, eyeY, 1))
    const glow = Math.max(0.05, lid * eyesOpen)
    halos.forEach(h => h.scale.set(eyeWiden, glow, 1))

    // Listening slot breathes.
    const breathe = reduceMotion ? 0 : Math.sin(t * 2.2)
    slotMat.emissiveIntensity = (1.6 + breathe * 0.6) * (hovering ? 1.4 : 1)

    glitch(dt, whiskers, whiskerBaseY)
  }

  function tick() {
    if (paused || destroyed) { raf = null; return }
    const dt = Math.min(clock.getDelta(), 0.05)
    elapsed += dt
    const t = elapsed

    // Shared, visitor-driven motion: look toward the cursor, widen on hover.
    currentLook.x += (targetLook.x - currentLook.x) * 0.07
    currentLook.y += (targetLook.y - currentLook.y) * 0.07
    eyeWiden += ((hovering ? 1.12 : 1) - eyeWiden) * 0.12
    haloMat.opacity = 0.75 + (hovering ? 0.25 : 0) + (reduceMotion ? 0 : Math.sin(t * 1.6) * 0.08)
    parallax.x += (targetParallax.x - parallax.x) * 0.05
    parallax.y += (targetParallax.y - parallax.y) * 0.05
    field.group.position.set(-parallax.x * 0.35, parallax.y * 0.25, 0)
    if (stageReady() && fieldFade < 1) fieldFade = Math.min(1, fieldFade + dt * 0.9)
    field.update(t, fieldFade)

    if (glb) updateGlb(dt)
    else if (bot.visible) updateProcedural(dt, t)

    renderer.render(scene, camera)
    if (reduceMotion && settled()) { raf = null; return }
    raf = requestAnimationFrame(tick)
  }

  function start() {
    // getDelta() drops the paused gap so the next frame's dt is small.
    if (!raf && active()) { clock.getDelta(); raf = requestAnimationFrame(tick) }
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null }
  }
  function setPaused(val) {
    paused = !!val
    sync()
  }

  function destroy() {
    destroyed = true
    stop()
    window.removeEventListener('resize', resize)
    ro?.disconnect()
    io?.disconnect()
    pointerTarget.removeEventListener('pointermove', onPointerMove)
    pointerTarget.removeEventListener('pointerleave', onPointerLeave)
    field.dispose()
    // The model's geometry is shared with other scenes: release only what
    // this instance owns, and take it out of the scene before the sweep.
    glb?.robot.dispose()
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
    shadowTex.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  }

  window.addEventListener('resize', resize, { passive: true })
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  ro?.observe(container)
  if (anchor) ro?.observe(anchor)
  pointerTarget.addEventListener('pointermove', onPointerMove, { passive: true })
  pointerTarget.addEventListener('pointerleave', onPointerLeave, { passive: true })
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => { offscreen = !entry.isIntersecting; sync() })
    : null
  io?.observe(pointerTarget)

  layout()
  renderer.render(scene, camera)
  start()

  return { setPaused, destroy, react, setMood, lookAtPoint, replayIntro, isShowing, hasIntro }
}
