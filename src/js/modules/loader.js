import gsap from 'gsap'

export function initLoader(onComplete) {
  const loader = document.getElementById('loader')
  const logo = document.querySelector('.ld-logo')
  const ldBg = document.querySelector('.ld-bg')

  const originalHTML = logo ? logo.innerHTML : ''
  const originalText = logo ? logo.textContent : ''
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

        // Blocks appear on charcoal bg — no ldBg fade
        gsap.to(blocks, {
          opacity: 1,
          duration: 0.2,
          stagger: { each: 0.005, from: 'random' },
          ease: 'power2.out',
          onComplete: () => {
            // Allow Lenis + animations to initialize behind the grid
            onComplete()

            const sorted = [...blocks].sort((a, b) => {
              const ia = blocks.indexOf(a), ib = blocks.indexOf(b)
              const ra = Math.floor(ia / 12), rb = Math.floor(ib / 12)
              return rb - ra || (ia % 12) - (ib % 12)
            })

            // Fade out ldBg alongside blocks to reveal hero
            if (ldBg) gsap.to(ldBg, { opacity: 0, duration: 0.3, ease: 'power2.in' })

            gsap.to(sorted, {
              opacity: 0,
              duration: 0.2,
              stagger: { each: 0.003 },
              ease: 'power2.in',
              onComplete: () => {
                const loadingEl = document.querySelector('.ld-loading')
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
