import gsap from 'gsap'

function buildLogoHTML(brand) {
  const dot = brand.indexOf('.')
  if (dot === -1) return brand
  const head = brand.slice(0, dot)
  const tail = brand.slice(dot + 1)
  return head + '<span>.</span><span>' + tail + '</span>'
}

export function playLoader({ brand = 'Gio', onComplete } = {}) {
  const loader = document.getElementById('loader')
  if (!loader) return
  const ldBg = document.querySelector('.ld-bg')

  // Reset so the loader can be replayed after a mode switch
  loader.style.zIndex = ''
  loader.style.pointerEvents = ''
  document.body.classList.remove('loader-done')
  if (ldBg) ldBg.style.opacity = '1'

  // Ensure the logo + loading elements exist (they are removed after each play)
  let logo = document.querySelector('.ld-logo')
  if (!logo) {
    logo = document.createElement('div')
    logo.className = 'ld-logo'
    loader.insertBefore(logo, ldBg ? ldBg.nextSibling : null)
  }
  const originalHTML = buildLogoHTML(brand)
  const originalText = brand
  logo.innerHTML = originalHTML

  let loadingEl = document.querySelector('.ld-loading')
  if (!loadingEl) {
    loadingEl = document.createElement('div')
    loadingEl.className = 'ld-loading'
    loadingEl.textContent = 'Loading'
    loader.appendChild(loadingEl)
  }

  // Remove any leftover grid overlay from a previous play
  const oldOverlay = document.querySelector('.ld-grid-overlay')
  if (oldOverlay) oldOverlay.remove()

  const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/`~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let step = 0

  const sc = setInterval(() => {
    if (!logo) { clearInterval(sc); return }
    logo.textContent = originalText.split('').map((c, i) => {
      if (i < step) return originalText[i]
      return chars[Math.floor(Math.random() * chars.length)]
    }).join('')
    step++
    if (step > originalText.length) {
      clearInterval(sc)
      logo.innerHTML = originalHTML
      gsap.to(logo, { scale: 1.08, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' })

      setTimeout(() => {
        const overlay = document.createElement('div')
        overlay.className = 'ld-grid-overlay'
        const blocks = []
        for (let i = 0; i < 144; i++) {
          const block = document.createElement('div')
          block.className = 'ld-block'
          overlay.appendChild(block)
          blocks.push(block)
        }
        loader.appendChild(overlay)

        gsap.to(blocks, {
          opacity: 1,
          duration: 0.2,
          stagger: { each: 0.005, from: 'random' },
          ease: 'power2.out',
          onComplete: () => {
            if (onComplete) onComplete()

            const sorted = [...blocks].sort((a, b) => {
              const ia = blocks.indexOf(a), ib = blocks.indexOf(b)
              const ra = Math.floor(ia / 12), rb = Math.floor(ib / 12)
              return rb - ra || (ia % 12) - (ib % 12)
            })

            // Fade out ldBg alongside blocks to reveal the app
            if (ldBg) gsap.to(ldBg, { opacity: 0, duration: 0.3, ease: 'power2.in' })

            gsap.to(sorted, {
              opacity: 0,
              duration: 0.2,
              stagger: { each: 0.003 },
              ease: 'power2.in',
              onComplete: () => {
                gsap.to([logo, loadingEl], {
                  opacity: 0,
                  duration: 0.15,
                  ease: 'power2.out',
                  onComplete: () => {
                    if (logo) logo.remove()
                    if (loadingEl) loadingEl.remove()
                    overlay.remove()

                    document.body.classList.add('loader-done')

                    loader.style.zIndex = '-1'
                    loader.style.pointerEvents = 'none'
                    if (ldBg) {
                      ldBg.style.opacity = '1'
                    }
                  },
                })
              },
            })
          },
        })
      }, 400)
    }
  }, 40)
}