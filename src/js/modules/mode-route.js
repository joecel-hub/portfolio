// URL <-> mode. `/lab` is the shareable Stryg.Bytes link; everything else
// is the Gio profile. Pure except applyModeMeta, which only runs in the page.

const LAB_TITLE = 'Stryg.Bytes | Technical Lab — Joecel Jaygee S. Pergis'

export function modeFromPath(pathname) {
  return pathname === '/lab' || pathname === '/lab/' ? 'lab' : 'gio'
}

export function pathForMode(mode) {
  return mode === 'lab' ? '/lab' : '/'
}

let gioTitle = null

// Title, canonical and og:url follow the mode, so a shared /lab link
// previews and indexes as the lab. The Gio title is whatever index.html
// shipped with, captured before the first change.
export function applyModeMeta(mode) {
  if (gioTitle === null) gioTitle = document.title
  document.title = mode === 'lab' ? LAB_TITLE : gioTitle

  const canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) return
  const url = new URL(pathForMode(mode), canonical.href).href
  canonical.setAttribute('href', url)
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', url)
}
