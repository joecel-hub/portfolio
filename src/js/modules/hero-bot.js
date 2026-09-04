import * as THREE from 'three'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode } from 'postprocessing'

// A small procedural "studio bot" mascot for the Dev hero — replaces the
// flat CSS eyes with a real floating 3D character. No external model file:
// built from primitives so it stays perfectly on-brand (purple/cyan glow)
// and adds zero licensing risk / asset weight.
export function initHeroBot(container, options = {}) {
  if (!container) return null

  const {
    shellColor = '#e7e7f2',
    accent1 = '#7c6eff',
    accent2 = '#00d4ff'
  } = options

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let width = container.clientWidth || 1
  let height = container.clientHeight || 1
  let paused = false
  let raf = null
  let destroyed = false

  const pointer = { x: 0, y: 0 }
  const targetLook = { x: 0, y: 0 }
  const currentLook = { x: 0, y: 0 }
  const clock = new THREE.Clock()

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100)
  camera.position.set(0, 0.05, 4.6)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // Tone mapping must NOT happen here — the renderer would bake it into
  // every RenderPass draw, handing bloom already-compressed [0,1] values
  // and forcing the threshold into awkward high fudge-numbers to compensate.
  // Instead: render truly linear/HDR, bloom that HDR signal, then tone-map
  // as the very last step (see ToneMappingEffect below).
  renderer.toneMapping = THREE.NoToneMapping
  container.appendChild(renderer.domElement)

  // Real bloom on the glowing eyes/antenna — cheap at this canvas size,
  // and it's what turns "emissive material" into an actual soft glow.
  // Bloom and tone mapping are combined into ONE EffectPass (not two) so
  // they compose in the same HDR shader pass, bloom first: scene -> bloom
  // (linear HDR) -> tone map (last, per the HDR bloom-system reference).
  const composer = new EffectComposer(renderer, { multisampling: Math.min(4, renderer.capabilities.maxSamples || 0) })
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new BloomEffect({
    intensity: 2.2,
    luminanceThreshold: 1.55,
    luminanceSmoothing: 0.35,
    mipmapBlur: true,
    radius: 0.75
  })
  const toneMap = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC, whitePoint: 3.5, middleGrey: 0.8 })
  composer.addPass(new EffectPass(camera, bloom, toneMap))

  // ── Lighting ── moderate, physically-plausible levels. The luminance
  // hierarchy that makes bloom read correctly comes from the EMISSIVE
  // materials below (eyes/antenna), not from cranking these scene lights.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x35304f, 0.6))
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(2, 2.5, 5)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.55)
  fill.position.set(-2, 1, 3)
  scene.add(fill)
  const front = new THREE.PointLight(0xffffff, 0.45, 12)
  front.position.set(0, 0.5, 4.5)
  scene.add(front)
  const rimA = new THREE.PointLight(new THREE.Color(accent1), 2.6, 9)
  rimA.position.set(-2.2, 1.2, -1.6)
  scene.add(rimA)
  const rimB = new THREE.PointLight(new THREE.Color(accent2), 2.2, 9)
  rimB.position.set(2.2, -1, -1.2)
  scene.add(rimB)

  const bot = new THREE.Group()
  scene.add(bot)

  // ── Head ──
  const headGeo = new THREE.SphereGeometry(1, 48, 48)
  headGeo.scale(1, 0.9, 0.86)
  const headMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(shellColor), roughness: 0.42, metalness: 0.05,
    clearcoat: 0.35, clearcoatRoughness: 0.35
  })
  const head = new THREE.Mesh(headGeo, headMat)
  bot.add(head)

  // subtle seam ring for a "helmet" feel
  const seamGeo = new THREE.TorusGeometry(0.98, 0.012, 8, 64)
  const seamMat = new THREE.MeshStandardMaterial({ color: 0xcfcfe0, roughness: 0.5 })
  const seam = new THREE.Mesh(seamGeo, seamMat)
  seam.rotation.x = Math.PI / 2
  seam.position.y = -0.05
  bot.add(seam)

  // ── Visor band across the face ──
  const visorGeo = new THREE.TorusGeometry(0.6, 0.05, 16, 64, Math.PI * 1.05)
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x14141f, roughness: 0.25, metalness: 0.65 })
  const visor = new THREE.Mesh(visorGeo, visorMat)
  visor.rotation.z = Math.PI * 0.975
  visor.position.set(0, 0.02, 0.62)
  bot.add(visor)

  // ── Eyes (glowing) ──
  const eyeGeo = new THREE.SphereGeometry(0.115, 24, 24)
  const eyeMatL = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accent1), emissive: new THREE.Color(accent1), emissiveIntensity: 3.6, roughness: 0.25
  })
  const eyeMatR = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accent2), emissive: new THREE.Color(accent2), emissiveIntensity: 3.6, roughness: 0.25
  })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMatL)
  eyeL.position.set(-0.29, 0.03, 0.82)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMatR)
  eyeR.position.set(0.29, 0.03, 0.82)
  bot.add(eyeL, eyeR)
  const eyes = [eyeL, eyeR]
  const eyeBaseScale = { x: 1, y: 1, z: 1 }

  // tiny catchlight dots so the eyes read as glassy/alive, not flat discs
  const highlightGeo = new THREE.SphereGeometry(0.03, 10, 10)
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const hlL = new THREE.Mesh(highlightGeo, highlightMat)
  hlL.position.set(-0.245, 0.09, 0.9)
  const hlR = new THREE.Mesh(highlightGeo, highlightMat)
  hlR.position.set(0.335, 0.09, 0.9)
  bot.add(hlL, hlR)

  // ── Antenna ──
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0x2b2b3c, roughness: 0.55 })
  )
  stem.position.set(0, 1.02, -0.08)
  bot.add(stem)
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 16, 16),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(accent1), emissive: new THREE.Color(accent1), emissiveIntensity: 4.2 })
  )
  tip.position.set(0, 1.22, -0.08)
  bot.add(tip)

  // ── Ear/side accent nubs ──
  const nubGeo = new THREE.CapsuleGeometry(0.09, 0.14, 6, 12)
  const nubMat = new THREE.MeshStandardMaterial({ color: 0x1c1c28, roughness: 0.4, metalness: 0.4 })
  const nubL = new THREE.Mesh(nubGeo, nubMat)
  nubL.rotation.z = Math.PI / 2
  nubL.position.set(-1.0, 0, -0.05)
  const nubR = nubL.clone()
  nubR.position.set(1.0, 0, -0.05)
  bot.add(nubL, nubR)

  bot.position.y = -0.05

  // ── Soft contact shadow so the bot reads as grounded, not pasted-on ──
  const shadowTex = (() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(0,0,0,0.45)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  })()
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(0, -1.02, 0.1)
  scene.add(shadow)

  // ── Blink cycle ──
  let blinkTimer = reduceMotion ? Infinity : 2.4 + Math.random() * 2.4
  let blinking = false
  let blinkT = 0

  function resize() {
    width = container.clientWidth || 1
    height = container.clientHeight || 1
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    composer.setSize(width, height)
  }

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect()
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
    pointer.x = Math.max(-1, Math.min(1, nx))
    pointer.y = Math.max(-1, Math.min(1, ny))
    targetLook.x = pointer.x * 0.32
    targetLook.y = -pointer.y * 0.2
  }

  function onPointerLeave() {
    targetLook.x = 0
    targetLook.y = 0
  }

  function tick() {
    if (paused || destroyed) { raf = null; return }
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime

    // idle float + sway
    if (!reduceMotion) {
      bot.position.y = -0.05 + Math.sin(t * 1.1) * 0.06
      bot.rotation.z = Math.sin(t * 0.7) * 0.02
    }

    // look-at cursor, smoothed
    currentLook.x += (targetLook.x - currentLook.x) * 0.08
    currentLook.y += (targetLook.y - currentLook.y) * 0.08
    bot.rotation.y = currentLook.x
    bot.rotation.x = currentLook.y

    // blink
    if (!reduceMotion) {
      blinkTimer -= dt
      if (blinkTimer <= 0 && !blinking) {
        blinking = true
        blinkT = 0
      }
      if (blinking) {
        blinkT += dt
        const closeDur = 0.07, openDur = 0.09
        let s = 1
        if (blinkT < closeDur) s = 1 - (blinkT / closeDur)
        else if (blinkT < closeDur + openDur) s = (blinkT - closeDur) / openDur
        else { blinking = false; blinkTimer = 2.4 + Math.random() * 2.6; s = 1 }
        eyes.forEach(eye => eye.scale.set(eyeBaseScale.x, Math.max(0.06, s), eyeBaseScale.z))
      }
    }

    // subtle antenna tip pulse
    tip.material.emissiveIntensity = 4.2 + Math.sin(t * 3) * 0.8

    composer.render()
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
    else start()
  }

  function destroy() {
    destroyed = true
    stop()
    window.removeEventListener('resize', resize)
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
    composer.dispose()
    renderer.dispose()
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  }

  window.addEventListener('resize', resize, { passive: true })
  container.addEventListener('pointermove', onPointerMove, { passive: true })
  container.addEventListener('pointerleave', onPointerLeave, { passive: true })

  composer.render()
  start()

  return { setPaused, destroy }
}
