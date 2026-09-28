import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toLabHtml } from '../server/labHtml.js'
import { LAB_TITLE, LAB_DESCRIPTION } from '../src/js/modules/mode-route.js'

// The shipped <head> shape (see index.html). Link-preview crawlers don't run
// JS, so /lab must be served with lab metadata already in the HTML.
const HEAD = `<head>
  <title>Gio Title</title>
  <meta name="description" content="Gio description" />
  <link rel="canonical" href="https://example.com/" />
  <meta property="og:title" content="Gio Title" />
  <meta property="og:description" content="Gio og description" />
  <meta property="og:url" content="https://example.com/" />
  <meta property="og:image" content="https://example.com/images/normal.jpeg" />
  <meta name="twitter:title" content="Gio Title" />
  <meta name="twitter:description" content="Gio twitter description" />
</head><body class="normal-mode"></body>`

test('lab-html: title, canonical and share tags describe the lab', () => {
  const out = toLabHtml(HEAD)
  assert.ok(out.includes(`<title>${LAB_TITLE}</title>`))
  assert.ok(out.includes('<link rel="canonical" href="https://example.com/lab" />'))
  assert.ok(out.includes('<meta property="og:url" content="https://example.com/lab" />'))
  for (const tag of ['property="og:title"', 'name="twitter:title"']) {
    assert.ok(out.includes(`<meta ${tag} content="${LAB_TITLE}" />`), tag)
  }
  for (const tag of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    assert.ok(out.includes(`<meta ${tag} content="${LAB_DESCRIPTION}" />`), tag)
  }
})

test('lab-html: nothing else changes', () => {
  const out = toLabHtml(HEAD)
  assert.ok(out.includes('content="https://example.com/images/normal.jpeg"'))
  assert.ok(out.includes('<body class="normal-mode">'))
  assert.equal(out.match(/Gio/g), null)
})
