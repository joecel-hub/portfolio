import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// "Chat with Gio" (/api/chat). Runs in its own process with a scratch DB and
// a stub Anthropic client, so no request ever leaves the machine.

const dir = mkdtempSync(join(tmpdir(), 'gio-chat-test-'))
process.env.DB_FILE = join(dir, 'test.db')
process.env.UPLOAD_DIR = join(dir, 'uploads')
process.env.JWT_SECRET = 'test-secret'
process.env.ADMIN_USER = 'admin'
process.env.ADMIN_PASS = 'testpass123'
process.env.GIT_PAT = ''
process.env.CHAT_RATE_LIMIT = '12'
process.env.CHAT_RATE_WINDOW_MS = '60000'
delete process.env.ANTHROPIC_API_KEY

const { app } = await import('../server/app.js')
const { db } = await import('../server/db.js')
const { setChatClient, buildKnowledge } = await import('../server/routes/chat.js')
const Anthropic = (await import('@anthropic-ai/sdk')).default

let server
let base

before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve) })
  base = `http://127.0.0.1:${server.address().port}`
  db.prepare("INSERT INTO projects (name, desc, tags, category) VALUES (?, ?, ?, ?)")
    .run('Test Ticketing Desk', 'A support-desk demo.', '["PHP","MySQL"]', 'systems')
  db.prepare('INSERT INTO certificates (name, issuer, cert_date, enabled) VALUES (?, ?, ?, 1)')
    .run('Visible Test Cert', 'Test Issuer', 'May 2026')
  db.prepare('INSERT INTO certificates (name, issuer, enabled) VALUES (?, ?, 0)')
    .run('Hidden Test Cert', 'Test Issuer')
})

after(async () => {
  setChatClient(null)
  await new Promise((resolve) => server?.close(resolve))
  db.close()
  rmSync(dir, { recursive: true, force: true })
})

const ask = (messages) => fetch(base + '/api/chat', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ messages })
}).then(async (r) => ({ status: r.status, body: await r.json() }))

const q = (text) => [{ role: 'user', content: text }]

// A stand-in for the SDK client: records the request, returns `reply`.
function stub(reply) {
  const calls = []
  return {
    calls,
    messages: {
      create: async (params) => {
        calls.push(params)
        if (reply instanceof Error) throw reply
        return reply
      }
    }
  }
}
const textReply = (text) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] })

test('chat: 503 not_configured without an API key', async () => {
  setChatClient(null)
  const r = await ask(q('What does Gio do?'))
  assert.equal(r.status, 503)
  assert.equal(r.body.error, 'not_configured')
})

test('chat: validates the conversation', async () => {
  setChatClient(stub(textReply('unused')))
  const bad = [
    [],
    [{ role: 'assistant', content: 'Hi' }],                                 // must start with the visitor
    [{ role: 'user', content: '   ' }],                                     // empty
    [{ role: 'user', content: 'x'.repeat(1001) }],                          // too long
    [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }],  // must end with the visitor
    [{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }],       // must alternate
    Array.from({ length: 13 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x' })) // too many
  ]
  for (const messages of bad) {
    const r = await ask(messages)
    assert.equal(r.status, 400, JSON.stringify(messages).slice(0, 80))
    assert.equal(r.body.error, 'invalid_messages')
  }
})

test('chat: knowledge includes live DB projects and enabled certificates only', () => {
  const k = buildKnowledge()
  assert.match(k, /Al Ghurair Contracting & Engineering Works/) // static file
  assert.match(k, /Test Ticketing Desk \(Business system\): A support-desk demo\. Technologies: PHP, MySQL\./)
  assert.match(k, /Visible Test Cert — Test Issuer \(May 2026\)/)
  assert.doesNotMatch(k, /Hidden Test Cert/)
})

test('chat: replies through the model with the grounded system prompt', async () => {
  const s = stub(textReply('Gio is an IT Support Engineer based in the UAE.'))
  setChatClient(s)
  const r = await ask([
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'Hello! Ask me about Gio.' },
    { role: 'user', content: '  What does Gio do?  ' }
  ])
  assert.equal(r.status, 200)
  assert.equal(r.body.reply, 'Gio is an IT Support Engineer based in the UAE.')
  const params = s.calls[0]
  assert.equal(params.model, 'claude-haiku-4-5')
  assert.match(params.system, /<knowledge>[\s\S]*Test Ticketing Desk[\s\S]*<\/knowledge>/)
  assert.match(params.system, /don't have that information/)
  assert.deepEqual(params.messages.at(-1), { role: 'user', content: 'What does Gio do?' })
})

test('chat: a refusal becomes a polite pointer to email', async () => {
  setChatClient(stub({ stop_reason: 'refusal', content: [] }))
  const r = await ask(q('Something off-limits'))
  assert.equal(r.status, 200)
  assert.match(r.body.reply, /joecelpergis@gmail\.com/)
})

test('chat: API failures map to 503 busy / 502, never a hang', async () => {
  setChatClient(stub(new Anthropic.RateLimitError(429, { message: 'slow down' }, undefined, new Headers())))
  const busy = await ask(q('Hi'))
  assert.equal(busy.status, 503)
  assert.equal(busy.body.error, 'busy')

  setChatClient(stub(new Anthropic.InternalServerError(500, { message: 'boom' }, undefined, new Headers())))
  const failed = await ask(q('Hi'))
  assert.equal(failed.status, 502)
  assert.equal(failed.body.error, 'chat_failed')
})

test('chat: rate limited per visitor', async () => {
  setChatClient(stub(textReply('ok')))
  let limited = null
  for (let i = 0; i < 15 && !limited; i++) {
    const r = await ask(q('Hi'))
    if (r.status === 429) limited = r
  }
  assert.ok(limited, 'expected a 429 within the limit')
  assert.equal(limited.body.error, 'rate_limited')
})
