export function initNavigation() {
  document.querySelectorAll('.rn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.target
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.querySelectorAll('.rn-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  const sectionEls = document.querySelectorAll('[id]')
  const rnObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.rn-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.target === e.target.id)
        })
      }
    })
  }, { threshold: 0.45 })
  sectionEls.forEach(s => rnObs.observe(s))

  window.addEventListener('scroll', () => {
    document.getElementById('topnav').classList.toggle('scrolled', window.scrollY > 60)
  })

  function closeMenu() {
    links.classList.remove('open')
    ham.classList.remove('open')
    backdrop.classList.remove('open')
    document.body.style.overflow = ''
  }

  function toggleMenu() {
    const open = links.classList.toggle('open')
    ham.classList.toggle('open')
    backdrop.classList.toggle('open')
    document.body.style.overflow = open ? 'hidden' : ''
  }

  const ham = document.getElementById('ham-btn')
  const links = document.getElementById('nav-links')
  const closeBtn = document.getElementById('nav-close')
  const backdrop = document.getElementById('nav-backdrop')
  if (ham && links) {
    ham.addEventListener('click', toggleMenu)
    if (closeBtn) closeBtn.addEventListener('click', closeMenu)
    if (backdrop) backdrop.addEventListener('click', closeMenu)
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMenu)
    })
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && links.classList.contains('open')) {
        closeMenu()
      }
    })
  }

  const skEl = document.getElementById('nav-skills')
  const wkEl = document.getElementById('nav-work')
  function updateNavLinks() {
    const nm = document.body.classList.contains('normal-mode')
    if (skEl) skEl.href = nm ? '#hobbies' : '#skills-dev'
    if (wkEl) { wkEl.href = nm ? '#resume' : '#projects'; wkEl.textContent = nm ? 'Resume' : 'Work' }
  }
  updateNavLinks()
  const mo = new MutationObserver(updateNavLinks)
  mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
}
