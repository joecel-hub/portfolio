import test from 'node:test'
import assert from 'node:assert/strict'
import { wantsIntro, markIntroSeen, INTRO_KEY } from '../src/js/modules/intro-gate.js'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
    data
  }
}

const ok = (over = {}) => ({
  mode: 'gio', storage: memoryStorage(), reduceMotion: false, saveData: false, cores: 8, webgl: true, ...over
})

test('intro plays on a first Gio visit in a capable browser', () => {
  assert.equal(wantsIntro(ok()), true)
})

test('intro never plays on the lab', () => {
  assert.equal(wantsIntro(ok({ mode: 'lab' })), false)
})

test('intro plays once per session', () => {
  const storage = memoryStorage()
  assert.equal(wantsIntro(ok({ storage })), true)
  markIntroSeen(storage)
  assert.equal(storage.data[INTRO_KEY], '1')
  assert.equal(wantsIntro(ok({ storage })), false)
})

test('reduced motion, Save-Data, no WebGL or a 2-core CPU skip it', () => {
  assert.equal(wantsIntro(ok({ reduceMotion: true })), false)
  assert.equal(wantsIntro(ok({ saveData: true })), false)
  assert.equal(wantsIntro(ok({ webgl: false })), false)
  assert.equal(wantsIntro(ok({ cores: 2 })), false)
})

test('without usable session storage it is skipped (it could not be limited to once)', () => {
  assert.equal(wantsIntro(ok({ storage: null })), false)
  const throwing = { getItem () { throw new Error('blocked') }, setItem () { throw new Error('blocked') } }
  assert.equal(wantsIntro(ok({ storage: throwing })), false)
  assert.doesNotThrow(() => markIntroSeen(throwing))
})
