import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'gio-cms-test-'))
process.env.DB_FILE = join(dir, 'test.db')
process.env.UPLOAD_DIR = join(dir, 'uploads')
process.env.JWT_SECRET = 'test-secret'
process.env.ADMIN_USER = 'admin'
process.env.ADMIN_PASS = 'testpass123'
process.env.GIT_PAT = ''
process.env.LOGIN_RATE_LIMIT = '3'
process.env.LOGIN_RATE_WINDOW_MS = '60000'

const { app } = await import('../server/app.js')
const { db } = await import('../server/db.js')
const { resetLoginBucket } = await import('../server/middleware/rateLimit.js')

let server
let base

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server?.close(resolve))
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

async function j(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  return { status: res.status, data, headers: res.headers }
}

async function login() {
  const r = await j('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'testpass123' },
  })
  assert.equal(r.status, 200)
  return r.data.token
}

test('health', async () => {
  const r = await j('/api/health')
  assert.equal(r.status, 200)
  assert.equal(r.data.ok, true)
})

test('seeded public lists', async () => {
  const projects = await j('/api/projects')
  assert.equal(projects.status, 200)
  assert.equal(projects.data.length, 4)
  const logos = await j('/api/logos')
  assert.equal(logos.status, 200)
  assert.equal(logos.data.length, 7)
  const certs = await j('/api/certificates')
  assert.equal(certs.status, 200)
  assert.equal(certs.data.length, 4)
  const testimonials = await j('/api/testimonials')
  assert.equal(testimonials.status, 200)
  assert.equal(testimonials.data.length, 0)
})

test('auth: correct credentials return a JWT', async () => {
  const ok = await j('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'testpass123' },
  })
  assert.equal(ok.status, 200)
  assert.ok(ok.data.token && ok.data.token.length > 20)
})

test('auth: wrong credentials are rejected with 401', async () => {
  const bad = await j('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'nope' },
  })
  assert.equal(bad.status, 401)
  assert.equal(bad.data.error, 'Invalid credentials')
})

test('auth: rate limit blocks brute force and resets on success', async () => {
  // clean bucket; also proves login still works (bucket was 1 from prior test)
  const reset = await j('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'testpass123' },
  })
  assert.equal(reset.status, 200)

  // under the cap, wrong creds are rejected and correct creds still succeed
  for (let i = 0; i < 2; i++) {
    const r = await j('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrong' },
    })
    assert.equal(r.status, 401)
  }
  const okMid = await j('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'testpass123' },
  })
  assert.equal(okMid.status, 200)

  // MAX=3 -> attempts 1..3 are allowed (401), the 4th is throttled (429)
  for (let i = 0; i < 3; i++) {
    const r = await j('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrong' },
    })
    assert.equal(r.status, 401)
  }
  const limited = await j('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'wrong' },
  })
  assert.equal(limited.status, 429)
  assert.ok(Number(limited.headers.get('retry-after')) > 0)

  // a locked-out IP is throttled even with the correct password
  const locked = await j('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'testpass123' },
  })
  assert.equal(locked.status, 429)

  // reset the bucket so later tests are unaffected
  resetLoginBucket({ ip: '127.0.0.1' })
})

test('projects: full CRUD lifecycle, auth required for writes', async () => {
  const token = await login()

  const anon = await j('/api/projects', { method: 'POST', body: { name: 'x' } })
  assert.equal(anon.status, 401)

  const badToken = await j('/api/projects', {
    method: 'POST',
    token: 'not-a-real-jwt',
    body: { name: 'x' },
  })
  assert.equal(badToken.status, 401)

  const created = await j('/api/projects', {
    method: 'POST',
    token,
    body: {
      name: 'Test Project',
      desc: 'temp row',
      tags: ['a', 'b'],
      thumb: 'wave',
      category: 'client',
      sort: 99,
    },
  })
  assert.equal(created.status, 201)
  const id = created.data.id
  assert.ok(id)

  const list = await j('/api/projects')
  assert.ok(list.data.some((p) => p.id === id))

  const upd = await j(`/api/projects/${id}`, {
    method: 'PUT',
    token,
    body: { name: 'Test Project v2' },
  })
  assert.equal(upd.status, 200)
  assert.equal(upd.data.name, 'Test Project v2')

  const del = await j(`/api/projects/${id}`, { method: 'DELETE', token })
  assert.equal(del.status, 200)
  const after = await j('/api/projects')
  assert.ok(!after.data.some((p) => p.id === id))
  assert.equal(after.data.length, 4)
})

test('projects: missing name is validated', async () => {
  const token = await login()
  const r = await j('/api/projects', { method: 'POST', token, body: {} })
  assert.equal(r.status, 400)
})

test('logos: missing name is validated', async () => {
  const token = await login()
  const r = await j('/api/logos', { method: 'POST', token, body: {} })
  assert.equal(r.status, 400)
})

test('reviews: public submit -> pending, admin list requires auth, approve -> testimonials', async () => {
  const token = await login()

  const pub = await j('/api/reviews', {
    method: 'POST',
    body: { project: 'AGCEW', name: 'Jane', role: 'Client', quote: 'Great work!', stars: 5 },
  })
  assert.equal(pub.status, 201)
  assert.equal(pub.data.status, 'pending')

  const anon = await j('/api/reviews')
  assert.equal(anon.status, 401)

  const list = await j('/api/reviews', { token })
  assert.equal(list.status, 200)
  const mine = list.data.find((r) => r.id === pub.data.id)
  assert.ok(mine && mine.status === 'pending')

  const approv = await j(`/api/reviews/${pub.data.id}/approve`, { method: 'POST', token })
  assert.equal(approv.status, 200)
  assert.equal(approv.data.status, 'approved')

  const t = await j('/api/testimonials')
  assert.ok(t.data.some((x) => x.name === 'Jane' && x.quote === 'Great work!'))
})

test('reviews: short quotes are rejected', async () => {
  const r = await j('/api/reviews', {
    method: 'POST',
    body: { name: 'Bob', quote: 'ok' },
  })
  assert.equal(r.status, 400)
})

test('persistence: pushback is disabled without GIT_PAT', async () => {
  const { isEnabled } = await import('../server/pushback.js')
  assert.equal(isEnabled(), false)
})