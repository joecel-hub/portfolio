import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let wired = false

export function initProfile() {
  const profile = document.getElementById('profile')
  if (!profile) return

  // Profile content is hidden during the initial Dev-mode load. Force text
  // back to its readable state before playing the profile entrance.
  gsap.set('#profile .section-title, #profile .section-title span, #profile .contact-form > *, #profile .pf-sec-text, #profile .pf-service-text, #profile .pf-tl-text, #profile .pf-project-desc, #profile .pf-name, #profile .pf-loc, #profile .pf-role', {
    opacity: 1,
    y: 0,
    clearProps: 'opacity,transform,visibility'
  })

  if (!wired) {
    wired = true
    const filters = profile.querySelectorAll('[data-vc-filter]')
    const projects = profile.querySelectorAll('[data-vc-cat]')
    filters.forEach(f => f.addEventListener('click', () => {
      filters.forEach(x => x.classList.remove('active'))
      f.classList.add('active')
      const cat = f.dataset.vcFilter
      projects.forEach(it => {
        it.classList.toggle('hidden', cat !== 'all' && it.dataset.vcCat !== cat)
      })
    }))
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl
    .fromTo('.pf-cover', { y: 18 }, { y: 0, duration: 0.7, opacity: 1 })
    .fromTo('.pf-head', { y: 20 }, { y: 0, duration: 0.6, opacity: 1 }, '-=0.4')
    .fromTo('.pf-avatar-wrap', { scale: 0.72 }, { scale: 1, duration: 0.65, ease: 'back.out(1.7)', opacity: 1 }, '-=0.45')

  requestAnimationFrame(() => ScrollTrigger.refresh())
}
