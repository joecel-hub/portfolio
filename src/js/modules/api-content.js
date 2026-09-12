const API_BASE = import.meta.env?.VITE_API_BASE || '/api'

const THUMB_BG = {
  resort: 'linear-gradient(135deg,#0d1a12,#0a2010)',
  corporate: 'linear-gradient(135deg,#0d0d1a,#1a1040)',
  ai: 'linear-gradient(135deg,#0d1a12,#0a2010)',
  motion: 'linear-gradient(135deg,#080d1a,#0a1040)',
  wave: 'linear-gradient(135deg,#0d0d1a,#1a1040)',
}

const THUMB_COLOR = {
  resort: '67,233,123',
  corporate: '124,110,255',
  ai: '67,233,123',
  motion: '124,110,255',
  wave: '124,110,255',
}

const THUMB_SVG = {
  resort: (c) => `<svg viewBox="0 0 600 200" fill="none">
    <defs><radialGradient id="tb-r" cx="50%" cy="6%"><stop offset="0%" stop-color="rgba(${c},0.5)"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>
    <circle cx="300" cy="10" r="150" fill="url(#tb-r)"/>
    <circle cx="512" cy="46" r="22" fill="rgba(255,214,102,0.55)"/>
    <rect y="116" width="600" height="84" fill="rgba(${c},0.07)"/>
    <path d="M0 116 q50 -7 100 0 t100 0 t100 0 t100 0 t100 0 t100 0" stroke="rgba(${c},0.5)" stroke-width="2" fill="none"/>
    <path d="M0 134 q50 -7 100 0 t100 0 t100 0 t100 0 t100 0 t100 0" stroke="rgba(${c},0.28)" stroke-width="1.5" fill="none"/>
    <path d="M220 116 Q300 64 380 116 Z" fill="rgba(${c},0.2)" stroke="rgba(${c},0.5)" stroke-width="1"/>
    <path d="M300 116 V84 M286 88 q-10 -14 -20 -8 M288 88 q-6 10 -2 20 M314 88 q10 -14 20 -8 M312 88 q6 10 2 20" stroke="rgba(${c},0.9)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="334" y="96" width="32" height="20" rx="2" fill="rgba(${c},0.4)" stroke="rgba(${c},0.7)" stroke-width="1"/>
    <rect x="339" y="100" width="22" height="12" rx="1" fill="rgba(255,255,255,0.18)"/>
    <circle cx="258" cy="86" r="4" fill="rgba(255,214,102,0.7)"/>
  </svg>`,
  corporate: (c) => `<svg viewBox="0 0 600 200" fill="none">
    <defs>
      <radialGradient id="tb-c" cx="50%" cy="0%"><stop offset="0%" stop-color="rgba(${c},0.5)"/><stop offset="100%" stop-color="transparent"/></radialGradient>
      <pattern id="tb-cw" width="26" height="22" patternUnits="userSpaceOnUse">
        <rect width="10" height="11" rx="1.5" fill="rgba(255,255,255,0.4)"/>
      </pattern>
    </defs>
    <circle cx="300" cy="0" r="150" fill="url(#tb-c)"/>
    <path d="M28 118 H572" stroke="rgba(${c},0.28)" stroke-width="1"/>
    <rect x="96" y="64" width="56" height="136" fill="rgba(${c},0.16)" stroke="rgba(${c},0.4)" stroke-width="1"/>
    <rect x="240" y="26" width="88" height="174" fill="rgba(${c},0.3)" stroke="rgba(${c},0.6)" stroke-width="1"/>
    <rect x="248" y="34" width="72" height="156" fill="url(#tb-cw)"/>
    <rect x="420" y="48" width="64" height="152" fill="rgba(${c},0.2)" stroke="rgba(${c},0.45)" stroke-width="1"/>
    <rect x="30" y="96" width="42" height="104" fill="rgba(${c},0.12)" stroke="rgba(${c},0.35)" stroke-width="1"/>
    <rect x="508" y="92" width="48" height="108" fill="rgba(${c},0.12)" stroke="rgba(${c},0.35)" stroke-width="1"/>
    <rect x="240" y="184" width="88" height="16" fill="rgba(${c},0.35)"/>
  </svg>`,
  ai: (c) => `<svg viewBox="0 0 600 200" fill="none">
    <defs><radialGradient id="tb-a" cx="50%" cy="0%"><stop offset="0%" stop-color="rgba(${c},0.5)"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>
    <circle cx="300" cy="0" r="150" fill="url(#tb-a)"/>
    <path d="M452 64 v18 M443 73 h18" stroke="rgba(255,214,102,0.8)" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="470" cy="40" r="3" fill="rgba(255,214,102,0.7)"/>
    <rect x="150" y="44" width="300" height="112" rx="14" fill="rgba(${c},0.06)" stroke="rgba(${c},0.3)" stroke-width="1.2"/>
    <rect x="176" y="66" width="200" height="34" rx="8" fill="rgba(${c},0.12)" stroke="rgba(${c},0.4)" stroke-width="1"/>
    <text x="190" y="87" font-family="JetBrains Mono" font-size="13" fill="rgba(${c},0.95)">&gt; build a booking bot_</text>
    <rect x="366" y="66" width="58" height="34" rx="8" fill="rgba(${c},0.4)"/>
    <path d="M368 70 v22 M370 70 h16 M390 70 h14 M390 84 h14 M368 84 v8" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round"/>
    <rect x="176" y="112" width="248" height="30" rx="8" fill="rgba(${c},0.18)"/>
    <circle cx="192" cy="127" r="4.5" fill="rgba(255,255,255,0.6)"/>
    <circle cx="206" cy="127" r="4.5" fill="rgba(255,255,255,0.45)"/>
    <circle cx="220" cy="127" r="4.5" fill="rgba(255,255,255,0.3)"/>
  </svg>`,
  motion: (c) => `<svg viewBox="0 0 600 200" fill="none">
    <defs>
      <radialGradient id="tb-m1" cx="35%" cy="50%"><stop offset="0%" stop-color="rgba(${c},0.5)"/><stop offset="100%" stop-color="transparent"/></radialGradient>
      <radialGradient id="tb-m2" cx="65%" cy="50%"><stop offset="0%" stop-color="rgba(67,233,123,0.4)"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    </defs>
    <circle cx="200" cy="100" r="130" fill="url(#tb-m1)" opacity="0.5"/>
    <circle cx="400" cy="100" r="130" fill="url(#tb-m2)" opacity="0.4"/>
    <circle cx="300" cy="100" r="120" stroke="rgba(${c},0.25)" stroke-width="1" stroke-dasharray="4 8" fill="none"/>
    <line x1="200" y1="100" x2="300" y2="72" stroke="rgba(${c},0.4)" stroke-width="1"/>
    <line x1="200" y1="100" x2="300" y2="128" stroke="rgba(${c},0.4)" stroke-width="1"/>
    <line x1="300" y1="72" x2="400" y2="100" stroke="rgba(67,233,123,0.4)" stroke-width="1"/>
    <line x1="300" y1="128" x2="400" y2="100" stroke="rgba(67,233,123,0.4)" stroke-width="1"/>
    <circle cx="200" cy="100" r="14" fill="rgba(${c},0.45)" stroke="rgba(${c},0.85)" stroke-width="1.5"/>
    <circle cx="300" cy="72" r="9" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
    <circle cx="300" cy="128" r="9" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>
    <circle cx="400" cy="100" r="14" fill="rgba(67,233,123,0.35)" stroke="rgba(67,233,123,0.8)" stroke-width="1.5"/>
    <path d="M96 40 a46 42 0 1 1 -2 80" stroke="rgba(${c},0.3)" stroke-width="1.5" stroke-dasharray="3 6" fill="none" transform="translate(410,8)"/>
  </svg>`,
  wave: (c) => `<svg viewBox="0 0 600 200" fill="none">
    <defs><radialGradient id="tb-w" cx="50%" cy="50%"><stop offset="0%" stop-color="rgba(${c},0.55)"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>
    <circle cx="300" cy="100" r="160" fill="url(#tb-w)" opacity="0.4"/>
    <path d="M80 100 Q200 35 300 100 Q400 165 520 100" stroke="rgba(${c},0.85)" stroke-width="2" fill="none"/>
    <path d="M80 120 Q200 55 300 120 Q400 185 520 120" stroke="rgba(255,110,188,0.5)" stroke-width="1.5" fill="none"/>
    <circle cx="300" cy="100" r="28" fill="rgba(${c},0.18)" stroke="rgba(${c},0.5)" stroke-width="1"/>
    <text x="284" y="108" font-family="JetBrains Mono" font-size="16" fill="rgba(${c},0.9)">2D</text>
  </svg>`,
}

const CATEGORY_PILL = { client: 'Client', saas: 'SaaS', apps: 'App', template: 'Template' }

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

let svgSeq = 0

function renderProjectCard(p) {
  const color = THUMB_COLOR[p.thumb] || THUMB_COLOR.wave
  const bg = THUMB_BG[p.thumb] || THUMB_BG.wave
  const uid = 'tb-' + (p.id || 'x') + '-' + (++svgSeq)
  const svg = (THUMB_SVG[p.thumb] || THUMB_SVG.wave)(color)
    .replace(/id="tb-([^"]+)"/g, (m, n) => `id="${uid}-${n}"`)
    .replace(/url\(#tb-([^)]+)\)/g, (m, n) => `url(#${uid}-${n})`)
  const thumbInner = p.image
    ? `<img class="project-thumb-img" src="${esc(p.image)}" alt="${esc(p.name)} screenshot" loading="lazy">`
    : svg
  const cat = CATEGORY_PILL[p.category] ? `pc-${p.category}` : 'pc-client'
  const tags = `<span class="pcategory ${cat}">${CATEGORY_PILL[p.category] || 'Client'}</span>` + (p.tags || []).map(t => `<span class="ptag">${esc(t)}</span>`).join('')
  const primary = p.demoUrl || p.url
  const arrow = primary ? `<div class="project-arrow">↗</div>` : ''
  const body = `
    <div class="project-thumb" style="background:${bg}">${thumbInner}</div>
    <div class="project-info">
      <div class="project-tags">${tags || '<span class="ptag">Work</span>'}</div>
      <div class="project-name">${esc(p.name)}</div>
      <div class="project-desc">${esc(p.desc)}</div>
    </div>`
  const linksRow = (p.demoUrl && p.url) ? `<div class="project-links">
      <a href="${esc(p.demoUrl)}" target="_blank" rel="noopener nofollow" aria-label="Open live demo of ${esc(p.name)}">View live demo</a>
      <a href="${esc(p.url)}" target="_blank" rel="noopener nofollow" aria-label="Open site of ${esc(p.name)}">Visit site</a>
    </div>` : ''
  if (primary) {
    return `<div class="project-card" data-category="${esc(p.category || 'client')}"><a class="project-link" href="${esc(primary)}" target="_blank" rel="noopener" aria-label="Open ${esc(p.name)}">${arrow}${body}</a>${linksRow}</div>`
  }
  return `<div class="project-card" data-category="${esc(p.category || 'client')}">${arrow}${body}</div>`
}

let activeFilter = 'all'

function applyProjectFilter() {
  const grid = document.querySelector('#projects .projects-grid')
  if (!grid) return
  grid.querySelectorAll('.project-card').forEach(card => {
    const cat = card.dataset.category || 'client'
    const show = activeFilter === 'all' || cat === activeFilter
    card.classList.toggle('is-hidden', !show)
  })
}

function initProjectFilters() {
  const bar = document.querySelector('#projects .projects-filters')
  if (!bar) return
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip')
    if (!btn) return
    activeFilter = btn.dataset.filter || 'all'
    bar.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c === btn))
    applyProjectFilter()
  })
}

async function loadProjects() {
  const grid = document.querySelector('#projects .projects-grid')
  if (!grid) return
  try {
    const res = await fetch(`${API_BASE}/projects`)
    if (!res.ok) return
    const projects = await res.json()
    if (!Array.isArray(projects) || projects.length === 0) return
    grid.innerHTML = projects.map(renderProjectCard).join('')
    applyProjectFilter()
  } catch {
    // API down -> keep static cards
  }
}

async function loadClientLogos() {
  const track = document.getElementById('client-track')
  if (!track) return
  try {
    const res = await fetch(`${API_BASE}/logos`)
    if (!res.ok) return
    const logos = await res.json()
    if (!Array.isArray(logos) || logos.length === 0) return
    track.innerHTML = logos.map(l => l.image
      ? `<span class="client-logo"><img class="client-logo-img" src="${esc(l.image)}" alt="${esc(l.name)}" loading="lazy"></span>`
      : `<span class="client-logo">${esc(l.name)}</span>`).join('')
  } catch {
    // keep placeholder
  }
}

async function loadTestimonials() {
  const grid = document.getElementById('testimonials-grid')
  if (!grid) return
  try {
    const res = await fetch(`${API_BASE}/testimonials`)
    if (!res.ok) return
    const items = await res.json()
    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = `<div class="t-card t-card--placeholder">
        <div class="t-stars">★★★★★</div>
        <p class="t-quote">Be the first to leave a review — testimonials approved from the admin panel appear here.</p>
        <div class="t-who"><span class="t-ava" aria-hidden="true">?</span><div>
          <div class="t-who-name">[ Your Name Here ]</div>
          <div class="t-who-role">Role &middot; Company</div>
        </div></div>
      </div>`
      return
    }
    grid.innerHTML = items.map(t => `
      <div class="t-card">
        <div class="t-stars">${'★'.repeat(Math.max(1, Math.min(5, t.stars || 5)))}</div>
        <p class="t-quote">${esc(t.quote)}</p>
        <div class="t-who">
          <span class="t-ava" aria-hidden="true">${esc((t.name || '?').charAt(0).toUpperCase())}</span>
          <div>
            <div class="t-who-name">${esc(t.name)}</div>
            <div class="t-who-role">${esc(t.role)}</div>
          </div>
        </div>
      </div>`).join('')
  } catch {
    // keep placeholder
  }
}

async function loadCertificates() {
  const grid = document.getElementById('pf-certs-track')
  if (!grid) return
  try {
    const res = await fetch(`${API_BASE}/certificates`)
    if (!res.ok) return
    const certs = await res.json()
    if (!Array.isArray(certs) || certs.length === 0) return
    grid.innerHTML = certs.map(renderCertCard).join('')
  } catch {
    // keep static cards
  }
}

function renderCertCard(c) {
  const meta = [c.issuer, c.date].filter(Boolean).join(' \u00b7 ')
  const href = c.link || c.pdf
  const inner = `
    <span class="pf-cert-img-wrap">
      <svg class="pf-cert-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
      ${c.image ? `<img class="pf-cert-img" src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" onerror="this.style.display='none'">` : ''}
    </span>
    <span class="pf-cert-name">${esc(c.name)}</span>
    ${meta ? `<span class="pf-cert-meta">${esc(meta)}</span>` : ''}`
  if (href) return `<a class="pf-cert" href="${esc(href)}" target="_blank" rel="noopener" title="View certificate">${inner}</a>`
  return `<div class="pf-cert" title="Certificate">${inner}</div>`
}

/* ---------- Hobby video showcase ---------- */

const HOBBY_CATEGORY_LABEL = {
  gaming: 'Gaming',
  editing: 'Video Editing',
  modeling: '3D Modeling',
  music: 'Music',
  choreography: 'Choreography',
}

// Figures out how a clip's video_url should be played: a lazily-loaded
// external iframe (YouTube/Vimeo) or a self-hosted <video> file.
function parseVideoEmbed(url) {
  if (!url) return null
  let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
  if (m) return { kind: 'youtube', id: m[1], src: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` }
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (m) return { kind: 'vimeo', id: m[1], src: `https://player.vimeo.com/video/${m[1]}?autoplay=1` }
  if (url.startsWith('/uploads/')) return { kind: 'file', src: url }
  return null
}

function playIconSvg() {
  return '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>'
}

/* Lightbox: click-to-watch, full size, with sound */
let vlbOverlay = null

function ensureLightbox() {
  if (vlbOverlay) return vlbOverlay
  vlbOverlay = document.createElement('div')
  vlbOverlay.className = 'vlb-overlay'
  vlbOverlay.innerHTML = `
    <div class="vlb-box" role="dialog" aria-modal="true" aria-labelledby="vlb-title">
      <div class="vlb-head">
        <div class="vlb-title" id="vlb-title"></div>
        <button type="button" class="vlb-close" aria-label="Close">&times;</button>
      </div>
      <div class="vlb-media" id="vlb-media"></div>
      <div class="vlb-desc" id="vlb-desc"></div>
    </div>`
  document.body.appendChild(vlbOverlay)
  vlbOverlay.addEventListener('click', (e) => { if (e.target === vlbOverlay) closeLightbox() })
  vlbOverlay.querySelector('.vlb-close').addEventListener('click', closeLightbox)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && vlbOverlay.classList.contains('vlb-open')) closeLightbox()
  })
  return vlbOverlay
}

function closeLightbox() {
  if (!vlbOverlay) return
  vlbOverlay.classList.remove('vlb-open')
  const media = vlbOverlay.querySelector('#vlb-media')
  if (media) media.innerHTML = '' // stop playback
}

function openLightbox(clip) {
  const overlay = ensureLightbox()
  overlay.querySelector('#vlb-title').textContent = clip.title || 'Watch'
  overlay.querySelector('#vlb-desc').textContent = clip.description || ''
  const media = overlay.querySelector('#vlb-media')
  const embed = parseVideoEmbed(clip.videoUrl)
  if (!embed) {
    media.innerHTML = `<div style="color:#aaa;padding:2rem;text-align:center">Video unavailable.</div>`
  } else if (embed.kind === 'file') {
    media.innerHTML = `<video src="${esc(embed.src)}" controls autoplay playsinline></video>`
  } else {
    media.innerHTML = `<iframe src="${esc(embed.src)}" title="${esc(clip.title || 'Video')}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`
  }
  overlay.classList.add('vlb-open')
}

/* Showcase grid: one card per clip, so multiple clips per hobby display
   naturally rather than being squeezed onto the 5 hobby cards. */
function renderShowcaseCard(clip) {
  const embed = parseVideoEmbed(clip.videoUrl)
  const thumb = clip.thumbnail || (embed?.kind === 'youtube' ? `https://img.youtube.com/vi/${embed.id}/hqdefault.jpg` : '')
  const thumbImg = thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy">` : ''
  // Self-hosted clips get a real hover-preview <video>; external embeds only
  // get a hover zoom + play icon — loading their iframe on hover is slow/flaky.
  const previewVideo = embed?.kind === 'file'
    ? `<video class="pf-showcase-preview" src="${esc(embed.src)}" muted loop playsinline preload="none"></video>`
    : ''
  return `
    <div class="pf-showcase-card" data-category="${esc(clip.category)}" tabindex="0" role="button" aria-label="Watch: ${esc(clip.title || 'clip')}">
      <div class="pf-showcase-thumb">
        ${thumbImg}
        ${previewVideo}
        <div class="pf-showcase-play">${playIconSvg()}</div>
      </div>
      <div class="pf-showcase-info">
        <span class="pf-showcase-tag">${esc(HOBBY_CATEGORY_LABEL[clip.category] || clip.category)}</span>
        <div class="pf-showcase-title">${esc(clip.title || 'Untitled clip')}</div>
      </div>
    </div>`
}

function wireShowcaseCard(el, clip) {
  const video = el.querySelector('.pf-showcase-preview')
  if (video) {
    el.addEventListener('mouseenter', () => {
      el.classList.add('is-previewing')
      video.currentTime = 0
      video.play().catch(() => {}) // autoplay can be blocked; card still opens on click
    })
    const stop = () => {
      el.classList.remove('is-previewing')
      video.pause()
    }
    el.addEventListener('mouseleave', stop)
    el.addEventListener('blur', stop)
  }
  el.addEventListener('click', () => openLightbox(clip))
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(clip) }
  })
}

async function loadHobbyClips() {
  const grid = document.getElementById('pf-showcase-grid')
  if (!grid) return
  try {
    const res = await fetch(`${API_BASE}/hobby-clips`)
    if (!res.ok) return
    const clips = await res.json()
    const withVideo = Array.isArray(clips) ? clips.filter(c => c.videoUrl) : []
    if (withVideo.length === 0) return // keep the static "add clips" placeholder
    grid.innerHTML = withVideo.map(renderShowcaseCard).join('')
    grid.querySelectorAll('.pf-showcase-card').forEach((el, i) => wireShowcaseCard(el, withVideo[i]))
  } catch {
    // API down -> keep static placeholder
  }
}

export function initApiContent() {
  initProjectFilters()
  return Promise.allSettled([
    loadProjects(),
    loadClientLogos(),
    loadTestimonials(),
    loadCertificates(),
    loadHobbyClips(),
  ])
}