import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const dir = mkdtempSync(join(tmpdir(), 'gio-cms-test-'))
process.env.DB_FILE = join(dir, 'test.db')
process.env.UPLOAD_DIR = join(dir, 'uploads')
process.env.JWT_SECRET = 'test-secret'
process.env.ADMIN_USER = 'admin'
process.env.ADMIN_PASS = 'testpass123'
process.env.GIT_PAT = ''
process.env.LOGIN_RATE_LIMIT = '3'
process.env.LOGIN_RATE_WINDOW_MS = '60000'
process.env.FORM_RATE_LIMIT = '5'
process.env.FORM_RATE_WINDOW_MS = '60000'
delete process.env.SMTP_HOST
delete process.env.SMTP_USER
delete process.env.SMTP_PASS

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

// Pins the shareable Stryg.Bytes link: /lab must keep reaching the SPA
// catch-all, so a future route can't shadow it. Needs a build (dist/).
test('spa: /lab serves the portfolio page', { skip: !existsSync(new URL('../dist/index.html', import.meta.url)) }, async () => {
  const res = await fetch(base + '/lab')
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /text\/html/)
  const html = await res.text()
  assert.match(html, /id="mode-switch"/)
  // Served with lab metadata baked in, for crawlers that don't run JS.
  assert.match(html, /<link rel="canonical" href="[^"]*\/lab"/)
  assert.match(html, /<meta property="og:title" content="Stryg\.Bytes/)
  // ...while / keeps the Gio head.
  const root = await (await fetch(base + '/')).text()
  assert.match(root, /<link rel="canonical" href="[^"]*\/"/)
})

// Vite fingerprints everything under /assets/, so those files can be cached
// for a year; the HTML must always be revalidated so deploys show at once.
test('caching: hashed assets are immutable, HTML is no-cache', { skip: !existsSync(new URL('../dist/index.html', import.meta.url)) }, async () => {
  const html = await fetch(base + '/')
  assert.match(html.headers.get('cache-control'), /no-cache/)
  const lab = await fetch(base + '/lab')
  assert.match(lab.headers.get('cache-control'), /no-cache/)
  const asset = (await html.text()).match(/\/assets\/[^"]+\.js/)[0]
  const res = await fetch(base + asset)
  assert.equal(res.status, 200)
  assert.match(res.headers.get('cache-control'), /max-age=31536000/)
  assert.match(res.headers.get('cache-control'), /immutable/)
})

test('seeded public lists', async () => {
  const projects = await j('/api/projects')
  assert.equal(projects.status, 200)
  assert.equal(projects.data.length, 2)
  assert.deepEqual(projects.data.map((p) => p.category).sort(), ['client', 'employer'])
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
  assert.equal(after.data.length, 2)
})

test('projects: legacy categories are coerced to the current set', async () => {
  const token = await login()
  const r = await j('/api/projects', { method: 'POST', token, body: { name: 'Legacy', category: 'template' } })
  assert.equal(r.status, 201)
  assert.equal(r.data.category, 'systems')
  await j(`/api/projects/${r.data.id}`, { method: 'DELETE', token })
})

test('bootstrap: fresh disk is seeded from the snapshot once, never overwritten', async () => {
  const { bootstrapData } = await import('../server/bootstrapData.js')
  const { writeFileSync, readFileSync, mkdirSync: mk, readdirSync } = await import('node:fs')
  const snap = join(dir, 'snap')
  mk(join(snap, 'uploads'), { recursive: true })
  writeFileSync(join(snap, 'portfolio.db'), 'SNAPSHOT')
  writeFileSync(join(snap, 'uploads', 'a.webp'), 'img')
  const disk = join(dir, 'disk')
  const opts = { dbFile: join(disk, 'portfolio.db'), uploadDir: join(disk, 'uploads'), snapshotDb: join(snap, 'portfolio.db'), snapshotUploads: join(snap, 'uploads') }

  assert.deepEqual(bootstrapData(opts), { db: true, uploads: 1 })
  assert.equal(readFileSync(opts.dbFile, 'utf8'), 'SNAPSHOT')
  assert.deepEqual(readdirSync(opts.uploadDir), ['a.webp'])

  // Live edits on the disk must survive every later boot.
  writeFileSync(opts.dbFile, 'LIVE')
  writeFileSync(join(snap, 'uploads', 'b.webp'), 'img')
  assert.deepEqual(bootstrapData(opts), { db: false, uploads: 0 })
  assert.equal(readFileSync(opts.dbFile, 'utf8'), 'LIVE')
})

test('migrations: legacy data is fixed once and not re-applied', async () => {
  const { initSchema } = await import('../server/db.js')
  // Simulate a pre-migration snapshot of the live CMS.
  db.prepare('DELETE FROM migrations').run()
  const ins = db.prepare("INSERT INTO projects (name, url, demo_url, category) VALUES (?, ?, ?, ?)")
  const agcew = ins.run('Legacy AGCEW Site', 'https://agcew.example', '', 'client').lastInsertRowid
  const itms = ins.run('Legacy Template', '', '/demos/x', 'template').lastInsertRowid
  ins.run('AI-Powered Assistant Build', '', '', 'apps')
  ins.run('Interactive Motion Experiment', '', '', 'apps')
  db.prepare("INSERT INTO reviews (name, quote, status) VALUES ('Sample Client', 'Placeholder — replace me', 'pending')").run()

  initSchema()
  const cat = (id) => db.prepare('SELECT category FROM projects WHERE id = ?').get(id).category
  assert.equal(cat(agcew), 'employer')
  assert.equal(cat(itms), 'systems')
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM projects WHERE name IN ('AI-Powered Assistant Build', 'Interactive Motion Experiment')").get().c, 0)
  assert.equal(db.prepare("SELECT COUNT(*) AS c FROM reviews WHERE name = 'Sample Client'").get().c, 0)

  // Re-adding a hidden project later (via /admin) must survive the next boot.
  const readded = ins.run('AI-Powered Assistant Build', '', '', 'systems').lastInsertRowid
  initSchema()
  assert.ok(db.prepare('SELECT id FROM projects WHERE id = ?').get(readded))

  db.prepare('DELETE FROM projects WHERE id IN (?, ?, ?)').run(agcew, itms, readded)
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
    body: { project: 'AGCEW', name: 'Jane', role: 'Client', quote: 'Great work!', stars: 5, consent: true },
  })
  assert.equal(pub.status, 201)
  assert.equal(pub.data.status, 'pending')
  assert.equal(pub.data.consent, true)

  const anon = await j('/api/reviews')
  assert.equal(anon.status, 401)

  const list = await j('/api/reviews', { token })
  assert.equal(list.status, 200)
  const mine = list.data.find((r) => r.id === pub.data.id)
  assert.ok(mine && mine.status === 'pending')
  assert.equal(mine.consent, true)
  assert.ok(mine.consent_at && mine.consent_at.length > 0)

  const approv = await j(`/api/reviews/${pub.data.id}/approve`, { method: 'POST', token })
  assert.equal(approv.status, 200)
  assert.equal(approv.data.status, 'approved')

  const t = await j('/api/testimonials')
  assert.ok(t.data.some((x) => x.name === 'Jane' && x.quote === 'Great work!'))
})

test('reviews: consent to publish is required', async () => {
  const r = await j('/api/reviews', {
    method: 'POST',
    body: { name: 'June', quote: 'No consent here', stars: 5 },
  })
  assert.equal(r.status, 400)
})

test('reviews: short quotes are rejected', async () => {
  const r = await j('/api/reviews', {
    method: 'POST',
    body: { name: 'Bob', quote: 'ok', consent: true },
  })
  assert.equal(r.status, 400)
})

test('persistence: pushback is disabled without GIT_PAT', async () => {
  const { isEnabled } = await import('../server/pushback.js')
  assert.equal(isEnabled(), false)
})
test('reviews: public submissions are rate limited per IP', async () => {
  // Earlier review tests already used part of this IP's allowance of 5.
  let limited = null
  for (let i = 0; i < 8 && !limited; i++) {
    const r = await j('/api/reviews', {
      method: 'POST',
      body: { name: 'Spam', quote: 'Spam spam spam', consent: true },
    })
    if (r.status === 429) limited = r
  }
  assert.ok(limited, 'expected a 429 after the per-IP review limit')
  assert.ok(Number(limited.headers.get('retry-after')) > 0)
})

test('security: CMS link fields reject non-http(s) URLs', async () => {
  const token = await login()
  const bad = await j('/api/projects', {
    method: 'POST',
    token,
    body: { name: 'XSS', url: 'javascript:alert(1)' },
  })
  assert.equal(bad.status, 400)
  const rel = await j('/api/projects', {
    method: 'POST',
    token,
    body: { name: 'Demo', demoUrl: '/demos/itms/index.html', url: 'https://example.com/' },
  })
  assert.equal(rel.status, 201)
  const proto = await j(`/api/projects/${rel.data.id}`, { method: 'PUT', token, body: { demoUrl: '//evil.example' } })
  assert.equal(proto.status, 400)
  await j(`/api/projects/${rel.data.id}`, { method: 'DELETE', token })

  const clip = await j('/api/hobby-clips', {
    method: 'POST',
    token,
    body: { category: 'gaming', videoUrl: 'data:text/html,hi' },
  })
  assert.equal(clip.status, 400)
})

test('security: production refuses to start with default admin credentials', () => {
  const run = (env) =>
    spawnSync(process.execPath, ['-e', "import('./server/auth.js').then(() => process.exit(0), () => process.exit(1))"], {
      env: { PATH: process.env.PATH, NODE_ENV: 'production', ...env },
      encoding: 'utf8',
    })
  assert.equal(run({}).status, 1)
  assert.equal(run({ ADMIN_PASS: 'admin123', JWT_SECRET: 'x'.repeat(40) }).status, 1)
  assert.equal(run({ ADMIN_PASS: 'a-real-password', JWT_SECRET: 'x'.repeat(40) }).status, 0)
})

test('security: no built-in admin credentials outside production either', () => {
  const run = (env) =>
    spawnSync(process.execPath, ['-e', "import('./server/auth.js').then(() => process.exit(0), () => process.exit(1))"], {
      env: { PATH: process.env.PATH, NODE_ENV: 'development', ...env },
      encoding: 'utf8',
    })
  assert.equal(run({}).status, 1)
  assert.equal(run({ ADMIN_PASS: 'a-real-password' }).status, 1)
  assert.equal(run({ ADMIN_PASS: 'a-real-password', JWT_SECRET: 'local-secret' }).status, 0)
})

// Render's free tier blocks SMTP ports, so the contact form sends through
// Resend's HTTPS API when RESEND_API_KEY is set. The API is stubbed here.
async function withResend(respond, fn) {
  const realFetch = globalThis.fetch
  const calls = []
  process.env.RESEND_API_KEY = 're_test_key'
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://api.resend.com/')) {
      calls.push({ url: String(url), init })
      return respond()
    }
    return realFetch(url, init)
  }
  try { await fn(calls) } finally {
    globalThis.fetch = realFetch
    delete process.env.RESEND_API_KEY
  }
}

test('contact: sends through Resend when RESEND_API_KEY is set', async () => {
  await withResend(() => new Response(JSON.stringify({ id: 'em_1' }), { status: 200 }), async (calls) => {
    const r = await j('/api/contact', { method: 'POST', body: { name: 'Ada', email: 'ada@example.com', subject: 'Hi', message: 'I would like a website.' } })
    assert.equal(r.status, 200)
    assert.equal(r.data.ok, true)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, 'https://api.resend.com/emails')
    assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test_key')
    const sent = JSON.parse(calls[0].init.body)
    assert.deepEqual(sent.to, ['joecelpergis@gmail.com'])
    assert.equal(sent.reply_to, 'ada@example.com')
    assert.equal(sent.subject, '[Portfolio] Hi')
    assert.match(sent.text, /I would like a website\.[\s\S]*Ada <ada@example\.com>/)
  })
})

test('contact: a Resend error is reported as 502, not a hang', async () => {
  await withResend(() => new Response('{"message":"boom"}', { status: 500 }), async () => {
    const r = await j('/api/contact', { method: 'POST', body: { name: 'Ada', email: 'ada@example.com', message: 'Hello there, website please.' } })
    assert.equal(r.status, 502)
    assert.equal(r.data.error, 'send_failed')
  })
})

test('contact: validates input, swallows honeypot, 503 without SMTP, rate limited', async () => {
  const ok = { name: 'Ada', email: 'ada@example.com', subject: 'Hi', message: 'I would like a website.' }

  const badEmail = await j('/api/contact', { method: 'POST', body: { ...ok, email: 'nope' } })
  assert.equal(badEmail.status, 400)

  const bot = await j('/api/contact', { method: 'POST', body: { ...ok, website: 'http://spam.example' } })
  assert.equal(bot.status, 200)
  assert.equal(bot.data.ok, true)

  const unconfigured = await j('/api/contact', { method: 'POST', body: ok })
  assert.equal(unconfigured.status, 503)
  assert.equal(unconfigured.data.error, 'not_configured')

  let limited = null
  for (let i = 0; i < 6 && !limited; i++) {
    const r = await j('/api/contact', { method: 'POST', body: ok })
    if (r.status === 429) limited = r
  }
  assert.ok(limited, 'expected a 429 after the per-IP contact limit')
})

test('certificates: kind and credential are stored, validated and returned', async () => {
  const token = await login()
  const created = await j('/api/certificates', {
    method: 'POST',
    token,
    body: { name: 'Test Event', issuer: 'Org', kind: 'event', credential: 'Certificate of Attendance' },
  })
  assert.equal(created.status, 201)
  assert.equal(created.data.kind, 'event')
  assert.equal(created.data.credential, 'Certificate of Attendance')

  const bogus = await j(`/api/certificates/${created.data.id}`, { method: 'PUT', token, body: { kind: 'bogus' } })
  assert.equal(bogus.status, 200)
  assert.equal(bogus.data.kind, 'event') // invalid kind keeps the existing value

  const pub = await j('/api/certificates')
  const mine = pub.data.find((c) => c.id === created.data.id)
  assert.equal(mine.kind, 'event')

  await j(`/api/certificates/${created.data.id}`, { method: 'DELETE', token })
})
