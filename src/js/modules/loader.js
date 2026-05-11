import gsap from 'gsap'

export function initLoader(onComplete) {
  const lbar = document.getElementById('lbar')
  const lpct = document.getElementById('lpct')
  const loader = document.getElementById('loader')
  let p = 0
  const iv = setInterval(() => {
    p += Math.random() * 18
    if (p >= 100) { p = 100; clearInterval(iv) }
    lbar.style.width = p + '%'
    lpct.textContent = Math.floor(p) + '%'
    if (p === 100) {
      setTimeout(() => {
        gsap.to(loader, {
          opacity: 0, duration: 0.8, ease: 'power2.inOut',
          onComplete: () => { loader.style.display = 'none'; onComplete() }
        })
      }, 300)
    }
  }, 55)
}
