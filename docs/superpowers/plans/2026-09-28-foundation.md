# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/lab` open Stryg.Bytes directly, unify section widths behind two container tokens, and split the Gio stylesheet. Apart from a ±20px width alignment, nothing visual changes.

**Architecture:**
- A pure module, `mode-route.js`, maps between the URL path and the mode, and updates the head metadata.
- `main.js` boots into the mode the path asks for, and `mode-toggle.js` keeps the URL in sync with `pushState`/`popstate`.
- The CSS work is mechanical: new tokens, a byte-preserving split of `profile.css`, and inline styles moved into classes.

**Tech Stack:** Vite, vanilla ES modules, GSAP, Express 5 (SPA catch-all already present), `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-28-foundation-design.md`

## Global Constraints
- **Paths:** the lab path is exactly `/lab`, and `/lab/` is accepted. Every other path is Gio (`/`).
- **No invented copy:** the lab title reuses the existing hero eyebrow wording: `Stryg.Bytes | Technical Lab — Joecel Jaygee S. Pergis`.
- **Container values:** `--container: 1200px` and `--container-narrow: 1100px`.
- **Width mapping:**
  - 1200 → `--container`
  - 1180 → `--container`
  - 1100 → `--container-narrow`
  - 1120 → `--container-narrow`
- **Profile split:** rules are moved byte-identically, in their original order.
- **Protected data:** never touch the tracked `server/portfolio.db`. The local API must run with `DB_FILE` pointing to a scratch copy.
- **Branch:** `feat/foundation`. No push until the user approves.

## Review Focus
1. **Back/Forward after in-page anchor clicks** (e.g. `/lab` → `#projects` → Back). The mode must not flip, because the path is unchanged. Task 2 covers this with a browser check.
2. **Direct `/lab` load while PixelBlast's idle mount fires.** PixelBlast must never mount in lab mode. Task 2 covers this with a console and DOM check (`#pixel-blast-container` is empty).
3. **Rapid double toggle** (clicking the mode switch twice quickly). The URL and the body class must end in agreement. Task 2 covers this with a browser check.
4. **`/LAB` and `/lab/extra`.** Both are Gio, and the page does not break. Task 1 covers this with a unit test.
5. **Canonical when booting on `/lab`.** It must be `…/lab`, not `/`. Task 2 covers this with a head check.

---

### Task 0: Baseline screenshots

**Files:** none (the output goes to the scratchpad).

- [ ] **Step 1: Start a local stack on a scratch DB**
```bash
cp server/portfolio.db "$SCRATCH/foundation.db"
DB_FILE="$SCRATCH/foundation.db" UPLOAD_DIR="$SCRATCH/uploads" npm run dev:full
```
Run it in the background. The site is at http://localhost:5173.
- [ ] **Step 2: Take the before screenshots.** With chrome-devtools, take full-page screenshots of Gio (`/`) and Stryg.Bytes (click `#mode-switch`, wait 3s) at 390×844, 768×1024 and 1280×800. Save them as `$SCRATCH/before-{gio,lab}-{390,768,1280}.png`.

---

### Task 1: `mode-route.js` (pure helpers)

**Files:**
- Create: `src/js/modules/mode-route.js`
- Test: `tests/mode-route.test.mjs`

**Interfaces (produces):**
- `modeFromPath(pathname: string): 'gio' | 'lab'`
- `pathForMode(mode: 'gio' | 'lab'): '/' | '/lab'`
- `applyModeMeta(mode: 'gio' | 'lab'): void`. This one touches `document` and is not unit-tested.

- [ ] **Step 1: Write the failing test**
```js
// tests/mode-route.test.mjs
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
```
- [ ] **Step 2: Run it.** `node --test tests/mode-route.test.mjs` should FAIL with "Cannot find module".
- [ ] **Step 3: Implement**
```js
// src/js/modules/mode-route.js
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
```
- [ ] **Step 4: Run it.** `npm test` should PASS: all 21 existing tests plus the 3 new ones.
- [ ] **Step 5: Commit**
```bash
git add src/js/modules/mode-route.js tests/mode-route.test.mjs
git commit -m "feat(route): mode-route helpers for the /lab link"
```

---

### Task 2: Boot from the path, sync the URL on toggle, handle Back/Forward

**Files:**
- Modify: `src/js/modules/mode-toggle.js` (the whole `initModeToggle`)
- Modify: `src/main.js:18-22` (boot class), `:36-46` (particles), `:159-160` (idle mounts), `:163-174` (init call), `:231-251` (loader)
- Modify: `public/sitemap.xml`
- Test: `tests/server.test.mjs` (a new `/lab` test)

**Interfaces:**
- **Consumes** from Task 1: `modeFromPath`, `pathForMode` and `applyModeMeta`.
- **Produces:** `initModeToggle(devBg, callbacks, initialMode = 'gio')` returns `{ toggleMode }`. `toggleMode({ push = true } = {})`.

- [ ] **Step 1: Write the failing server test.** Add it to `tests/server.test.mjs`, next to the existing `node:fs` import (add `existsSync` to that import):
```js
test('spa: /lab serves the portfolio page', { skip: !existsSync(new URL('../dist/index.html', import.meta.url)) }, async () => {
  const res = await fetch(base + '/lab')
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /text\/html/)
  assert.match(await res.text(), /id="mode-switch"/)
})
```
- [ ] **Step 2: Run it.** Run `npm run build && npm test`. This test should PASS right away, because the catch-all already exists; it pins the behaviour so a future route can't shadow `/lab`. Every other test must still pass.
- [ ] **Step 3: Rewrite `mode-toggle.js` `initModeToggle`**
```js
import { pathForMode, applyModeMeta, modeFromPath } from './mode-route.js'

export function initModeToggle(devBg, callbacks = {}, initialMode = 'gio') {
  let isNormal = initialMode !== 'lab'

  // ...closeMenu() unchanged...

  function toggleMode({ push = true } = {}) {
    isNormal = !isNormal
    const mode = isNormal ? 'gio' : 'lab'
    // Keep the address bar shareable: / is Gio, /lab is Stryg.Bytes.
    if (push) history.pushState(null, '', pathForMode(mode))
    applyModeMeta(mode)
    closeMenu()
    // ...the existing gsap fade / class toggle / loader body, unchanged...
  }

  // Back/Forward across a mode change. Hash-only entries keep the same
  // path, so they never flip the mode.
  window.addEventListener('popstate', () => {
    const wantNormal = modeFromPath(location.pathname) !== 'lab'
    if (wantNormal !== isNormal) toggleMode({ push: false })
  })

  // ...finalize() unchanged...
  return { toggleMode }
}
```
- [ ] **Step 4: Boot from the path in `src/main.js`**
  - Add the import `import { modeFromPath, applyModeMeta } from './js/modules/mode-route.js'`.
  - Replace lines 20–22 with:
    ```js
    // `/` boots the Gio profile; `/lab` boots straight into Stryg.Bytes.
    const bootMode = modeFromPath(location.pathname)
    const bootLab = bootMode === 'lab'
    if (!bootLab) document.body.classList.add('normal-mode')
    applyModeMeta(bootMode)
    ```
  - Particles: change `if (particles) particles.setPaused(true)` to `if (particles) particles.setPaused(!bootLab)`.
  - Idle mounts: replace `mountType()` (line 160) with:
    ```js
    if (bootLab) { syncThemeColor(false); ensureHeroBot() } else mountType()
    ```
    Import `syncThemeColor` from `./js/modules/mode-toggle.js`. `whenIdle(... isNormalMode() ...)` already guards PixelBlast.
  - Pass the mode in: `initModeToggle(particles, { ... }, bootMode)`.
  - Loader: change `brand: 'Gio'` to `brand: bootLab ? 'Stryg.Bytes' : 'Gio'`, and inside `onComplete` change `initProfile()` to `if (!bootLab) initProfile()`. Also guard the catch fallback the same way.
- [ ] **Step 5: Add `/lab` to the sitemap.** Insert this after the `/` entry in `public/sitemap.xml`:
```xml
  <url>
    <loc>https://gio-portfolio-6f1d.onrender.com/lab</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
```
- [ ] **Step 6: Browser check** with chrome-devtools on the Task 0 stack. Every item must hold:
  1. Load `/lab`. The Stryg.Bytes loader plays, `#hero` is visible, `body` has no `normal-mode` class, `#pixel-blast-container` is empty, the title is the lab title, and the canonical ends in `/lab`.
  2. Reload `/lab`. It is still lab mode.
  3. Click `#mode-switch`. The URL is `/`, Gio shows, and the title is the Gio title.
  4. Press Back. The URL is `/lab` and lab mode is back. Press Forward. The URL is `/` and Gio is back.
  5. On `/lab`, click the Explore button (`#projects`), then press Back. The mode stays lab.
  6. Double-click `#mode-switch` quickly, wait 3s, and confirm the URL mode matches `body.normal-mode`.
  7. Load `/lab#projects`. It lands on the projects section.
  8. The console has no errors.
- [ ] **Step 7: Run `npm test`.** Everything should PASS.
- [ ] **Step 8: Commit**
```bash
git add src/main.js src/js/modules/mode-toggle.js public/sitemap.xml tests/server.test.mjs
git commit -m "feat(route): /lab opens Stryg.Bytes; mode switch keeps the URL in sync"
```

---

### Task 3: Container tokens

**Files:** `src/styles/tokens.css:62`, `src/styles/base.css:131`, `src/styles/components/profile.css:61,98,227`, `src/styles/components/projects.css:7,83`, `src/styles/components/testimonials.css:110`, `src/styles/components/skills.css:102`

The existing `.sec-inner` in `base.css` already is the container utility, so it gets the token and no duplicate `.container` class is added.

- [ ] **Step 1: Add the tokens.** In `tokens.css`, directly after `--measure: 68ch;`:
```css
  --container: 1200px;
  --container-narrow: 1100px;
```
- [ ] **Step 2: Replace the literal widths**
  - `max-width: 1200px` and `max-width: 1180px` become `max-width: var(--container)`.
  - `max-width: 1100px` and `max-width: 1120px` become `max-width: var(--container-narrow)`.
  - Apply this only at the lines listed above.
  - Confirm with `grep -rn "max-width: *1[12][0-9]0px" src/styles`. The only matches should be ones intentionally outside this list; list them in the commit message if any exist.
- [ ] **Step 3: Build and check.** Run `npm run build`. Compare a 1280px screenshot of Gio and Lab against the baseline: only the widths of `.pf-cover`, `.pf-head` and `.pf-body` (+20px) and the dev skills grid (−20px) may differ.
- [ ] **Step 4: Commit.** `git commit -am "style(layout): --container / --container-narrow replace four ad-hoc max-widths"`

---

### Task 4: Split `profile.css` and use one mode-visibility mechanism

**Files:**
- Delete: `src/styles/components/profile.css`
- Create, all under `src/styles/components/gio/` (the numbers are line ranges in the current file):

  | File | Lines |
  |---|---|
  | `layout.css` | 1–4 and 20–57 |
  | `cover.css` | 58–224 (cover and profile head) |
  | `sections.css` | 225–284 |
  | `whatido.css` | 285–336 |
  | `resume.css` | 337–418 |
  | `skills.css` | 419–487 |
  | `portfolio.css` | 488–582 |
  | `certs-hobbies.css` | 583–634 |
  | `showcase.css` | 635–837 |
  | `contact.css` | 838–921 |
  | `responsive.css` | 922–end |

  Lines 5–19 are the ID-based hide rules and are dropped. The split follows the file's own section comments, and `responsive.css` stays last so the cascade is unchanged.
- Modify: `src/styles/style.css` (replace the `profile.css` import with the 11 gio imports in the table's order), and `index.html:150,234,1197` (add `class="dev-only"`).

Line numbers are for the file *after* Task 3. Task 3 changes values only, not the line count.

- [ ] **Step 1: Split with a script.** Save this as `$SCRATCH/split-profile.cjs` and run it with `node`:
```js
const fs = require('fs'), path = require('path')
const src = 'src/styles/components/profile.css'
const L = fs.readFileSync(src, 'utf8').split('\n')
const r = (a, b) => L.slice(a - 1, b === 'end' ? L.length : b).join('\n')
const parts = [
  ['layout', r(1, 4) + '\n' + r(20, 57)], ['cover', r(58, 224)], ['sections', r(225, 284)],
  ['whatido', r(285, 336)], ['resume', r(337, 418)], ['skills', r(419, 487)],
  ['portfolio', r(488, 582)], ['certs-hobbies', r(583, 634)], ['showcase', r(635, 837)],
  ['contact', r(838, 921)], ['responsive', r(922, 'end')],
]
const dir = 'src/styles/components/gio'
fs.mkdirSync(dir, { recursive: true })
for (const [n, body] of parts) fs.writeFileSync(path.join(dir, n + '.css'), body.replace(/\n*$/, '\n'))
// Verify: concatenation == original minus lines 5–19 (whitespace-normalised)
const norm = s => s.replace(/\s+/g, ' ').trim()
const expected = norm([...L.slice(0, 4), ...L.slice(19)].join('\n'))
const got = norm(parts.map(p => p[1]).join('\n'))
if (expected !== got) { console.error('MISMATCH'); process.exit(1) }
console.log('split OK')
```
Before running it, check that line 58 starts `/* ── Cover`, line 225 starts `/* ── Scrollable body`, and line 922 starts `/* ── Responsive`. If they don't, stop and recompute the ranges from the section comments. Expected output: `split OK`.
- [ ] **Step 2: Update imports.** In `style.css`, replace `@import './components/profile.css';` with the 11 `@import './components/gio/<name>.css';` lines in the order listed. Then run `git rm src/styles/components/profile.css`.
- [ ] **Step 3: Unify visibility.** In `index.html`, change `<section id="hero">`, `<section id="about" ...>` and `<section id="contact">` to include `class="dev-only"`. For `#about`, Task 5 adds a second class, so write it as `class="dev-only"` now.
- [ ] **Step 4: Build and check parity.** Run `npm run build`, then take a screenshot of both modes at all three widths and compare with the Task 3 state. They must be identical. Confirm that Gio still hides `#hero`, `#about`, `#contact`, `#skills-dev` and `#projects`, and that Lab still shows them.
- [ ] **Step 5: Commit.** `git add -A src/styles index.html && git commit -m "refactor(css): split Gio profile.css per section; .dev-only is the single mode-visibility mechanism"`

---

### Task 5: Inline styles → classes

**Files:** `index.html:234,316,318,1088,1103,1122,1145,1159`, `src/styles/utilities.css`, `src/styles/components/about.css`, `src/styles/components/projects.css`

- [ ] **Step 1: Add the classes**
```css
/* utilities.css: next to the other helpers */
.bg-alt { background: var(--bg2); }

/* about.css: end of file */
.about-visual { display: flex; justify-content: center; align-items: center; }
.about-visual-circuit { width: 100%; max-width: 420px; }

/* projects.css: directly after the .project-thumb rule */
.project-thumb--green { background: linear-gradient(135deg, #0d1a12, #0a2010); }
.project-thumb--violet { background: linear-gradient(135deg, #0d0d1a, #1a1040); }
```
- [ ] **Step 2: Replace the eight attributes in `index.html`**
  - `#about` becomes `class="dev-only bg-alt"`.
  - `#projects` becomes `class="dev-only bg-alt"`.
  - Line 316 becomes `class="about-visual"`.
  - Line 318 becomes `class="dev-only about-visual-circuit"`.
  - Line 1103 becomes `class="project-thumb project-thumb--green"`.
  - Lines 1122, 1145 and 1159 become `class="project-thumb project-thumb--violet"`.
  - Remove each `style="..."` you replace. Confirm with `grep -c 'style="' index.html`, which must print `0`.
- [ ] **Step 3: Build and check parity.** Run `npm run build`. Both modes at 1280px must be identical to the Task 4 state. Check the Lab About and Projects backgrounds in particular.
- [ ] **Step 4: Commit.** `git commit -am "refactor(html): inline styles moved to classes"`

---

### Task 6: Final verification and report

- [ ] **Step 1: Gate.** Run `npm test` (25/25 expected; the `/lab` server test runs because `dist` exists) and `npm run build`. Both must pass.
- [ ] **Step 2: After screenshots.** Take the same 6 screenshots as Task 0. Compare each pair and write down every difference. The only allowed difference is the ±20px container shift.
- [ ] **Step 3: Repeat the Task 2 Step 6 browser checklist** on the final build.
- [ ] **Step 4: Clean up.** Stop the dev stack by port (5173–5175 and the API port), confirm `git status` is clean and `server/portfolio.db` is unchanged (`git diff --quiet main -- server/portfolio.db`).
- [ ] **Step 5: Report to the user**, then STOP. The report covers:
  - the commits;
  - the test and build results;
  - the screenshot comparison;
  - the checklist results;
  - that nothing is pushed yet.
