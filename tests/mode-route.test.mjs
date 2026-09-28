import { test } from 'node:test'
import assert from 'node:assert/strict'
import { modeFromPath, pathForMode } from '../src/js/modules/mode-route.js'

test('mode-route: /lab and /lab/ are the lab', () => {
  assert.equal(modeFromPath('/lab'), 'lab')
  assert.equal(modeFromPath('/lab/'), 'lab')
})

test('mode-route: everything else is Gio', () => {
  for (const p of ['/', '', '/LAB', '/lab/extra', '/labs', '/privacy', '/admin']) {
    assert.equal(modeFromPath(p), 'gio', p)
  }
})

test('mode-route: pathForMode round-trips', () => {
  assert.equal(pathForMode('lab'), '/lab')
  assert.equal(pathForMode('gio'), '/')
  assert.equal(modeFromPath(pathForMode('lab')), 'lab')
  assert.equal(modeFromPath(pathForMode('gio')), 'gio')
})
