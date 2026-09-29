import * as THREE from 'three'

// Code-driven expressions on top of the robot's Blender clips. The clips give
// it life (Intro drop-in, Idle float/blink/breathe); this layer adds what the
// visitor causes: looking toward the cursor or a section, a hover widen, and a
// few short reactions. Everything is written after the mixer each frame, on
// channels the clips don't own (root rotation, the inner body, flap hinges,
// glow materials), so the two never fight.
//
//   look      setLook(x, y): gentle turn, radians (x = yaw, y = pitch)
//   hover     setHover(bool): eyes widen, glow brightens
//   mood      setMood('thinking' | 'talking' | null): held until cleared
//   one-shot  play('happy' | 'wave' | 'welcome'): short reaction, then idle
//
// Idle by default: nothing moves beyond the Idle clip unless asked.

const ONE_SHOTS = {
  happy: 1.1,   // eyes squint into a smile, two small hops, glow up
  wave: 1.4,    // flaps swing out and back three times
  welcome: 1.8  // wave + happy together
}

const THINK_EYE = new THREE.Color(1.3, 3.1, 4.4) // over-bright lab blue
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.pow(1 - rate, dt * 60))
const _q = new THREE.Quaternion()
const Y = new THREE.Vector3(0, 1, 0)

export function createExpressions(robot, { reduceMotion = false, glitch = true } = {}) {
  const look = { x: 0, y: 0, tx: 0, ty: 0 }
  let hover = false
  let widen = 1
  let mood = null
  let thinkMix = 0
  let talkMix = 0
  let shot = null // { name, t, dur }
  let time = 0
  const baseEye = robot.eyeMat.color.clone()
  const bodyRestY = robot.body.position.y
  let glitchTimer = reduceMotion || !glitch ? Infinity : 4 + Math.random() * 3
  let glitchT = -1

  function play(name) {
    if (reduceMotion || !ONE_SHOTS[name]) return
    shot = { name, t: 0, dur: ONE_SHOTS[name] }
  }

  // A 0→1→0 envelope over a one-shot's progress p.
  const env = (p) => Math.sin(Math.PI * clamp01(p))

  function update(dt) {
    time += dt
    // The clips write eye scale (blink/open); reset first so the multipliers
    // below never compound on frames where no clip writes it.
    robot.eyes.forEach((e, i) => e.scale.copy(robot.eyeRest[i]))
    robot.mixer?.update(dt)

    look.x = approach(look.x, look.tx, 0.07, dt)
    look.y = approach(look.y, look.ty, 0.07, dt)
    widen = approach(widen, hover ? 1.12 : 1, 0.12, dt)
    thinkMix = approach(thinkMix, mood === 'thinking' ? 1 : 0, 0.06, dt)
    talkMix = approach(talkMix, mood === 'talking' ? 1 : 0, 0.15, dt)

    let squint = 0, hop = 0, flap = 0, glow = 0
    if (shot) {
      shot.t += dt
      const p = shot.t / shot.dur
      if (p >= 1) shot = null
      else {
        const happy = shot.name === 'happy' || shot.name === 'welcome'
        const wave = shot.name === 'wave' || shot.name === 'welcome'
        if (happy) {
          squint = env(p / 0.9) * 0.55
          hop = Math.abs(Math.sin(p * Math.PI * 2)) * (1 - p) * 0.12
          glow = env(p) * 0.3
        }
        if (wave) flap = Math.sin(p * Math.PI * 6) * env(p) * 0.5
      }
    }

    // Thinking: a slight upward, off-to-the-side glance.
    robot.root.rotation.y = look.x - thinkMix * 0.18
    robot.root.rotation.x = look.y - thinkMix * 0.1
    robot.body.position.y = bodyRestY + hop
    robot.flaps.forEach((f, i) => {
      f.quaternion.copy(robot.flapRest[i])
      if (flap) f.quaternion.multiply(_q.setFromAxisAngle(Y, Math.abs(flap) * robot.flapOut[i]))
    })
    robot.eyes.forEach(e => {
      e.scale.x *= widen
      e.scale.y *= widen * (1 - squint)
    })
    if (robot.idle) robot.idle.timeScale = 1 - thinkMix * 0.45

    robot.eyeMat.color.copy(baseEye).lerp(THINK_EYE, thinkMix)
    const pulse = reduceMotion ? 0 : Math.sin(time * 1.6) * 0.08
    robot.haloMat.opacity = 0.75 + (hover ? 0.25 : 0) + pulse + glow
    if (robot.slotMat) {
      const breathe = reduceMotion ? 0 : Math.sin(time * 2.2)
      // Talking: a quick, uneven flicker, like a voice meter.
      const talk = talkMix * (0.6 + 0.6 * Math.abs(Math.sin(time * 13) * Math.sin(time * 7.3)))
      robot.slotMat.emissiveIntensity = robot.slotBase * (1 + breathe * 0.3) * (hover ? 1.4 : 1) * (1 + talk)
    }
    whiskerGlitch(dt)
  }

  // A short flicker of the whisker marks every few seconds.
  function whiskerGlitch(dt) {
    if (glitchTimer === Infinity) return
    glitchTimer -= dt
    if (glitchTimer <= 0 && glitchT < 0) glitchT = 0
    if (glitchT < 0) return
    glitchT += dt
    const on = glitchT < 0.2
    robot.whiskers.forEach((w, i) => {
      w.visible = !on || Math.random() > 0.35
      w.position.y = robot.whiskerY[i] + (on ? (Math.random() - 0.5) * 0.03 * (i % 2 ? 1 : -1) : 0)
    })
    if (!on) { glitchT = -1; glitchTimer = 4 + Math.random() * 3 }
  }

  // True while something is still changing (for loops that sleep when still).
  function busy() {
    return !!shot || robot.introRunning() ||
      Math.abs(look.tx - look.x) > 0.0005 || Math.abs(look.ty - look.y) > 0.0005 ||
      Math.abs((hover ? 1.12 : 1) - widen) > 0.0005 ||
      Math.abs((mood === 'thinking' ? 1 : 0) - thinkMix) > 0.002 ||
      Math.abs((mood === 'talking' ? 1 : 0) - talkMix) > 0.002
  }

  return {
    update,
    play,
    busy,
    setLook(x, y) { look.tx = x; look.ty = y },
    setHover(v) { hover = !!v },
    setMood(m) { mood = m || null },
    get mood() { return mood }
  }
}
