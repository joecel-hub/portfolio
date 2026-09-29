import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
// Fingerprinted by Vite (served from /assets/ with a year-long cache).
import defaultModelUrl from '../../../assets/models/robot-cube.glb?url'

// The robot-cube mascot (made in Blender, clips "Intro" and "Idle"), shared by
// every scene that shows it: the lab hero, the lab's docked assistant and the
// Gio intro. The file is fetched and prepared once; each scene gets its own
// clone with its own mixer and glow materials. Geometry is shared between
// clones, so an instance's dispose() never frees it.

const cache = new Map() // url → Promise<{ template, clips }>

export function loadRobot(url = defaultModelUrl) {
  if (!cache.has(url)) {
    const p = new Promise((resolve, reject) => new GLTFLoader().load(url, resolve, undefined, reject))
      .then(prepare)
    // A failed load may be retried later (e.g. after a network blip).
    p.catch(() => cache.delete(url))
    cache.set(url, p)
  }
  return cache.get(url)
}

function prepare(gltf) {
  const template = gltf.scene
  const clips = Object.fromEntries(gltf.animations.map(c => [c.name, c]))
  // Pose on the Intro's last keyframes before any mixer exists: those are the
  // values a mixer restores when Intro stops, and what reduced motion shows.
  // (The exporter samples the rest pose at Intro's start.)
  if (clips.Intro) settleOnClipEnd(template, clips.Intro)
  mergeMeshes(template, o => /^Trim\d/.test(o.name), 'Trims')
  mergeMeshes(template, o => o.name.startsWith('WhiskerL'), 'WhiskersL')
  mergeMeshes(template, o => o.name.startsWith('WhiskerR'), 'WhiskersR')
  template.traverse(o => { if (o.material) o.material.fog = false })
  return { template, clips }
}

// Soft glow sprite behind each eye. A transparent canvas can't show bloom,
// so the halo carries the glow. One texture serves every instance.
let haloTex = null
export function haloTexture() {
  if (!haloTex) {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(210,240,255,0.9)')
    g.addColorStop(0.35, 'rgba(120,200,240,0.35)')
    g.addColorStop(1, 'rgba(120,200,240,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    haloTex = new THREE.CanvasTexture(c)
  }
  return haloTex
}

// A fresh robot from the loaded template. With reduceMotion there is no
// mixer: the robot holds the settled pose.
export function createRobotInstance({ template, clips }, { reduceMotion = false } = {}) {
  const model = template.clone(true)
  const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4) })
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false })
  const haloGeo = new THREE.PlaneGeometry(0.62, 0.72)
  const eyes = ['EyeL', 'EyeR'].map(n => model.getObjectByName(n)).filter(Boolean)
  eyes.forEach(e => {
    e.material = eyeMat
    const h = new THREE.Mesh(haloGeo, haloMat)
    h.position.z = 0.002
    h.renderOrder = -1
    e.add(h)
  })
  // The slot glow is animated per scene, so each instance owns its material.
  const slot = model.getObjectByName('Slot')
  const slotMat = slot ? slot.material.clone() : null
  if (slot) slot.material = slotMat
  const whiskers = ['WhiskersL', 'WhiskersR'].map(n => model.getObjectByName(n)).filter(Boolean)
  const flaps = ['FlapL', 'FlapR'].map(n => model.getObjectByName(n)).filter(Boolean)

  let mixer = null, intro = null, idle = null
  if (!reduceMotion && (clips.Intro || clips.Idle)) {
    mixer = new THREE.AnimationMixer(model)
    idle = clips.Idle ? mixer.clipAction(clips.Idle) : null
    if (clips.Intro) {
      intro = mixer.clipAction(clips.Intro)
      intro.setLoop(THREE.LoopOnce, 1)
      mixer.addEventListener('finished', (ev) => {
        if (ev.action !== intro) return
        intro.stop()
        idle?.play()
      })
    }
  }

  return {
    model,
    root: model.getObjectByName('RobotCube') || model,
    // The un-animated inner node (holds the -45° yaw): free for hops/tilts.
    body: model.getObjectByName('Model') || model,
    eyes,
    eyeRest: eyes.map(e => e.scale.clone()),
    eyeMat,
    haloMat,
    slotMat,
    slotBase: slotMat ? slotMat.emissiveIntensity : 1,
    whiskers,
    whiskerY: whiskers.map(w => w.position.y),
    flaps,
    flapRest: flaps.map(f => f.quaternion.clone()),
    // Sign of a hinge turn (about the flap's local Y) that swings it outward,
    // away from its face: FlapL sits on +Z turned 180°, FlapR on +X turned 90°.
    flapOut: flaps.map(f => (f.name === 'FlapR' ? -1 : 1)),
    mixer,
    intro,
    idle,
    // (Re)play the drop-in: from the top, then Idle takes over.
    playIntro() {
      if (!intro) { idle?.play(); return }
      idle?.stop()
      intro.reset().play()
    },
    introRunning: () => !!intro && intro.isRunning(),
    dispose() {
      mixer?.stopAllAction()
      mixer?.uncacheRoot(model)
      eyeMat.dispose()
      haloMat.dispose()
      haloGeo.dispose()
      slotMat?.dispose()
      model.removeFromParent()
    }
  }
}

// Apply each track's final keyframe (e.g. "RobotCube.position") to its node.
function settleOnClipEnd(model, clip) {
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.')
    const node = model.getObjectByName(track.name.slice(0, dot))
    const prop = node && node[track.name.slice(dot + 1)]
    if (!prop || typeof prop.fromArray !== 'function') continue
    const n = track.getValueSize()
    prop.fromArray(track.values, track.values.length - n)
  }
}

// Join sibling meshes that share a material into one (one draw call).
function mergeMeshes(model, match, name) {
  const parts = []
  model.traverse(o => { if (o.isMesh && match(o)) parts.push(o) })
  if (parts.length < 2) return parts[0] || null
  const parent = parts[0].parent
  if (parts.some(p => p.parent !== parent || p.material !== parts[0].material)) return null
  const geo = mergeGeometries(parts.map(p => { p.updateMatrix(); return p.geometry.clone().applyMatrix4(p.matrix) }))
  if (!geo) return null
  const merged = new THREE.Mesh(geo, parts[0].material)
  merged.name = name
  parts.forEach(p => { parent.remove(p); p.geometry.dispose() })
  parent.add(merged)
  return merged
}

// The light rig the robot was lit for (glow comes from the emissive parts).
export function addRobotLights(scene, { blue = '#1597d4', orange = '#ff8a3d' } = {}) {
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
}
