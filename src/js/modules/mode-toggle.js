import gsap from 'gsap'

export function initModeToggle() {
  let isNormal = false
  const msTrack = document.getElementById('ms-track')
  const msTop = document.getElementById('ms-top')
  const msBot = document.getElementById('ms-bot')

  function closeMenu() {
    const links = document.getElementById('nav-links')
    const ham = document.getElementById('ham-btn')
    const backdrop = document.getElementById('nav-backdrop')
    if (links && links.classList.contains('open')) {
      links.classList.remove('open')
      ham.classList.remove('open')
      if (backdrop) backdrop.classList.remove('open')
      document.body.style.overflow = ''
    }
  }

  msTrack.addEventListener('click', () => {
    isNormal = !isNormal
    closeMenu()
    gsap.to('#app', {
      opacity: 0, duration: 0.25, onComplete: () => {
        document.body.classList.toggle('normal-mode', isNormal)
        if (window._threeSetNormal) window._threeSetNormal(isNormal)
        const stop0 = document.querySelector('#bgrad stop')
        if (stop0) stop0.style.stopColor = isNormal ? '#5b4fcf' : '#7c6eff'
        msTop.textContent = isNormal ? 'Normal' : 'Dev'
        msBot.textContent = isNormal ? 'Dev' : 'Normal'
        msTop.classList.toggle('active', !isNormal)
        msBot.classList.toggle('active', isNormal)
        gsap.to('#app', { opacity: 1, duration: 0.4, ease: 'power2.out' })
        setTimeout(() => {
          document.querySelectorAll('.skill-bar').forEach(bar => {
            const w = bar.getAttribute('data-width') || 80
            bar.style.width = '0%'
            setTimeout(() => { bar.style.width = w + '%'; bar.style.transition = 'width 1.2s ease' }, 50)
          })
        }, 350)
      }
    })
  })
}
