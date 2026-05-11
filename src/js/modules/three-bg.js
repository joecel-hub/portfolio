import * as THREE from 'three'
import gsap from 'gsap'

export function initThreeBg() {
  const canvas = document.getElementById('bg-canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 18

  scene.add(new THREE.AmbientLight(0x7c6eff, 0.4))
  const pA = new THREE.PointLight(0x7c6eff, 2.5, 70); pA.position.set(-10, 10, 10); scene.add(pA)
  const pB = new THREE.PointLight(0x00d4ff, 2, 70); pB.position.set(10, -10, 5); scene.add(pB)

  const geos = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.7, 0.24, 8, 22),
    new THREE.OctahedronGeometry(0.9, 0),
    new THREE.TorusKnotGeometry(0.5, 0.17, 60, 8),
    new THREE.TetrahedronGeometry(1, 0),
  ]
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x7c6eff, wireframe: true, transparent: true, opacity: 0.55 }),
    new THREE.MeshStandardMaterial({ color: 0x00d4ff, wireframe: false, transparent: true, opacity: 0.10, roughness: 0.2, metalness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0xff6ebc, wireframe: true, transparent: true, opacity: 0.4 }),
  ]

  const meshes = []
  const COUNT = 24
  for (let i = 0; i < COUNT; i++) {
    const geo = geos[Math.floor(Math.random() * geos.length)]
    const mat = mats[Math.floor(Math.random() * mats.length)].clone()
    const mesh = new THREE.Mesh(geo, mat)
    const spread = 32
    mesh.position.set((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 12)
    const s = 0.3 + Math.random() * 1.5
    mesh.scale.setScalar(s)
    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.007, rotY: (Math.random() - 0.5) * 0.009, rotZ: (Math.random() - 0.5) * 0.006,
      originX: mesh.position.x, originY: mesh.position.y, phase: Math.random() * Math.PI * 2,
    }
    scene.add(mesh)
    meshes.push(mesh)
  }

  const PARTICLE_COUNT = 600
  const particleGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const sizes = new Float32Array(PARTICLE_COUNT)
  const origins = new Float32Array(PARTICLE_COUNT * 3)
  const phases = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const spread = 40
    positions[i * 3] = (Math.random() - 0.5) * spread
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread
    positions[i * 3 + 2] = (Math.random() - 0.5) * 18
    origins[i * 3] = positions[i * 3]
    origins[i * 3 + 1] = positions[i * 3 + 1]
    origins[i * 3 + 2] = positions[i * 3 + 2]
    sizes[i] = 0.02 + Math.random() * 0.06
    phases[i] = Math.random() * Math.PI * 2
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const particleMat = new THREE.PointsMaterial({
    color: 0x8b85ff,
    size: 0.06,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })

  const particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  let mx = 0, my = 0
  document.addEventListener('mousemove', e => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2 })

  let t = 0
  const particlePos = particleGeo.attributes.position.array

  function animate() {
    requestAnimationFrame(animate); t += 0.008
    meshes.forEach(m => {
      m.rotation.x += m.userData.rotX; m.rotation.y += m.userData.rotY; m.rotation.z += m.userData.rotZ
      m.position.x = m.userData.originX + Math.sin(t + m.userData.phase) * 1.4
      m.position.y = m.userData.originY + Math.cos(t + m.userData.phase * 1.3) * 1.1
    })
    camera.position.x += (mx * 1.4 - camera.position.x) * 0.018
    camera.position.y += (-my * 1.4 - camera.position.y) * 0.018
    camera.lookAt(scene.position)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phase = phases[i]
      particlePos[i * 3] = origins[i * 3] + Math.sin(t * 0.3 + phase) * 1.2
      particlePos[i * 3 + 1] = origins[i * 3 + 1] + Math.cos(t * 0.25 + phase * 1.1) * 0.9
      particlePos[i * 3 + 2] = origins[i * 3 + 2] + Math.sin(t * 0.2 + phase * 0.8) * 0.5
    }
    particleGeo.attributes.position.needsUpdate = true

    renderer.render(scene, camera)
  }
  animate()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  window._threeSetNormal = function (isNormal) {
    meshes.forEach(m => {
      const targetOpacity = isNormal ? 0 : (m.material.wireframe ? 0.55 : 0.1)
      gsap.to(m.material, { opacity: targetOpacity, duration: 1.2 })
      if (isNormal) {
        m.material.color.setHex(0x5b4fcf)
      }
    })
    gsap.to(particleMat, {
      opacity: isNormal ? 0.6 : 0,
      duration: 1.5,
      ease: 'power2.inOut'
    })
    if (isNormal) {
      gsap.to(particleMat.color, {
        r: 0x5b / 255, g: 0x4f / 255, b: 0xcf / 255,
        duration: 1.5
      })
    }
  }
}
