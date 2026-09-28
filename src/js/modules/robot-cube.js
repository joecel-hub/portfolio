import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode } from 'postprocessing'

// The Stryg.Bytes robot-cube logo as a live 3D mascot for the lab hero.
// Built from primitives to match the flat logo (dark cube seen corner-on,
// glowing eyes, blue "book" flaps, orange corners, white whisker marks,
// a listening slot on top) — no model file, no licensing, tiny weight.
// Same API as the previous hero bot: initHeroBot(container) → { setPaused, destroy }.
export function initHeroBot(container, options = {}) {
  if (!container) return null

  const {
    leftColor = '#10231e',
    rightColor = '#102652',
    blue = '#1597d4',
    orange = '#ff8a3d'
  } = options

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let width = container.clientWidth || 1
  let height = container.clientHeight || 1
  let paused = false
  let raf = null
  let destroyed = false
  let hovering = false

  const targetLook = { x: 0, y: 0 }
  const currentLook = { x: 0, y: 0 }
  const clock = new THREE.Clock()

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100)
  camera.position.set(0, 1.8, 5.5)
  camera.lookAt(0, -0.1, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // Render linear HDR; bloom the HDR signal, tone-map last (one EffectPass).
  renderer.toneMapping = THREE.NoToneMapping
  container.appendChild(renderer.domElement)

  const composer = new EffectComposer(renderer, { multisampling: Math.min(4, renderer.capabilities.maxSamples || 0) })
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new BloomEffect({
    intensity: 2.4,
    luminanceThreshold: 1.05,
    luminanceSmoothing: 0.3,
    mipmapBlur: true,
    radius: 0.7
  })
  const toneMap = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC, whitePoint: 3.5, middleGrey: 0.8 })
  composer.addPass(new EffectPass(camera, bloom, toneMap))

  // ── Lighting ── glow hierarchy comes from the emissive eyes/slot.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2436, 0.9))
  scene.add(new THREE.AmbientLight(0xffffff, 0.35))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(2.5, 4, 5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.5)
  fill.position.set(-3, 1.5, 3)
  scene.add(fill)
  const rimBlue = new THREE.PointLight(new THREE.Color(blue), 3, 10)
  rimBlue.position.set(-2.6, 1.4, -1.8)
  scene.add(rimBlue)
  const rimOrange = new THREE.PointLight(new THREE.Color(orange), 2.2, 10)
  rimOrange.position.set(2.6, -1.2, -1.4)
  scene.add(rimOrange)

  // The cube is seen corner-on like the logo: local +Z is the left face,
  // local +X the right face, and (S, y, S) the front edge.
  const S = 0.8 // half size
  const BASE_YAW = -Math.PI / 4
  const bot = new THREE.Group()
  bot.rotation.y = BASE_YAW
  scene.add(bot)

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

  const haloTex = (() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(210,240,255,0.9)')
    g.addColorStop(0.35, 'rgba(120,200,240,0.35)')
    g.addColorStop(1, 'rgba(120,200,240,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  })()
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false })
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
  scene.add(shadow)

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
    composer.setSize(width, height)
    wake()
  }

  // Reduced motion holds a static pose, so the loop sleeps once the cube has
  // settled and only wakes for pointer/resize changes (no 60fps idle renders).
  function settled() {
    return Math.abs(targetLook.x - currentLook.x) < 0.0005 &&
      Math.abs(targetLook.y - currentLook.y) < 0.0005 &&
      Math.abs((hovering ? 1.12 : 1) - eyeWiden) < 0.0005
  }
  function wake() {
    if (reduceMotion && !paused && !destroyed) start()
  }

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect()
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1))
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1))
    targetLook.x = nx * 0.4
    targetLook.y = ny * 0.16
    hovering = true
    wake()
  }
  function onPointerLeave() {
    targetLook.x = 0
    targetLook.y = 0
    hovering = false
    wake()
  }

  function tick() {
    if (paused || destroyed) { raf = null; return }
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime

    // Intro: drop in and settle, flaps unfold, then the eyes open.
    if (introT < INTRO) introT = Math.min(INTRO, introT + dt)
    const p = introT / INTRO
    const drop = easeOutBack(clamp01(p / 0.7))
    const unfold = easeOutCubic(clamp01((p - 0.35) / 0.45))
    const eyesOpen = easeOutCubic(clamp01((p - 0.75) / 0.25))

    const float = reduceMotion ? 0 : Math.sin(t * 1.1) * 0.06
    bot.position.y = (1 - drop) * 1.6 + float
    bot.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.7) * 0.015

    // Look toward the cursor, smoothed.
    currentLook.x += (targetLook.x - currentLook.x) * 0.07
    currentLook.y += (targetLook.y - currentLook.y) * 0.07
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
    eyeWiden += ((hovering ? 1.12 : 1) - eyeWiden) * 0.12
    const eyeY = EYE_Y * eyeWiden * Math.max(0.05, lid * eyesOpen)
    eyes.forEach(e => e.scale.set(eyeWiden, eyeY, 1))
    const glow = Math.max(0.05, lid * eyesOpen)
    halos.forEach(h => h.scale.set(eyeWiden, glow, 1))
    haloMat.opacity = 0.75 + (hovering ? 0.25 : 0) + (reduceMotion ? 0 : Math.sin(t * 1.6) * 0.08)

    // Listening slot breathes.
    const breathe = reduceMotion ? 0 : Math.sin(t * 2.2)
    slotMat.emissiveIntensity = (1.6 + breathe * 0.6) * (hovering ? 1.4 : 1)

    // Whisker glitch: a short flicker every few seconds.
    if (!reduceMotion) {
      glitchTimer -= dt
      if (glitchTimer <= 0 && glitchT < 0) glitchT = 0
      if (glitchT >= 0) {
        glitchT += dt
        const on = glitchT < 0.2
        whiskers.forEach((w, i) => {
          w.visible = !on || Math.random() > 0.35
          w.position.y = 0.18 + (on ? (Math.random() - 0.5) * 0.03 * (i % 2 ? 1 : -1) : 0)
        })
        if (!on) { glitchT = -1; glitchTimer = 4 + Math.random() * 3 }
      }
    }

    composer.render()
    if (reduceMotion && settled()) { raf = null; return }
    raf = requestAnimationFrame(tick)
  }

  function start() {
    if (!raf && !paused) { clock.start(); raf = requestAnimationFrame(tick) }
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null }
  }
  function setPaused(val) {
    paused = !!val
    if (paused) stop()
    else { resize(); start() }
  }

  function destroy() {
    destroyed = true
    stop()
    window.removeEventListener('resize', resize)
    ro?.disconnect()
    container.removeEventListener('pointermove', onPointerMove)
    container.removeEventListener('pointerleave', onPointerLeave)
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
    shadowTex.dispose()
    haloTex.dispose()
    composer.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  }

  window.addEventListener('resize', resize, { passive: true })
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  ro?.observe(container)
  container.addEventListener('pointermove', onPointerMove, { passive: true })
  container.addEventListener('pointerleave', onPointerLeave, { passive: true })

  composer.render()
  start()

  return { setPaused, destroy }
}
