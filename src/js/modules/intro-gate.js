// Whether the Gio first-visit intro should play. Kept tiny and free of
// Three.js so the decision costs nothing on the critical path; the intro
// itself (gio-intro.js) is only downloaded when this says yes.

export const INTRO_KEY = 'sb:intro-seen'

export function wantsIntro({ mode, storage, reduceMotion, saveData, cores, webgl }) {
  if (mode !== 'gio' || reduceMotion || saveData || !webgl) return false
  if ((cores || 4) <= 2) return false
  // Once per browser session. If storage is unavailable (blocked, private
  // modes) the intro can't be limited to once, so it is skipped.
  try {
    return !!storage && storage.getItem(INTRO_KEY) !== '1'
  } catch {
    return false
  }
}

export function markIntroSeen(storage) {
  try { storage?.setItem(INTRO_KEY, '1') } catch { /* storage blocked */ }
}
