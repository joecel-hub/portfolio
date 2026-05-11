# Portfolio Vite Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert monolithic `gio_portfolio_ultimate.html` into a Vite-powered project with modular CSS/JS files.

**Architecture:** Vite dev server serves `index.html` which imports `src/main.js`. Main imports CSS modules from `src/styles/components/` and JS modules from `src/js/modules/`. Each JS module exports an init function called by the orchestrator.

**Tech Stack:** Vite 5, Vanilla JS, GSAP 3, Three.js r134, CSS Custom Properties

---

### Task 1: Scaffold Vite Project Config

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Modify: `index.html` (new entry point)
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "gio-portfolio",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "gsap": "^3.12.5",
    "three": "^0.134.0"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
  },
})
```

- [ ] **Step 3: Create .gitignore**

```
node_modules
dist
.DS_Store
*.local
```

- [ ] **Step 4: Create the new entry index.html**

`index.html` will be a minimal shell that links to `src/main.js`. The full HTML content (sections, SVGs) will be kept in `index.html` — only the `<style>` and `<script>` blocks are removed.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gio — Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=Syne:wght@400;700;800&display=swap"
    rel="stylesheet" />
  <link rel="modulepreload" href="/src/main.js" />
</head>
<body>
  <!-- All body content from original gio_portfolio_ultimate.html goes here -->
  <!-- Including: .noise, .cursor, #loader, #bg-canvas, #liquid-wrap, -->
  <!-- #mode-switch, #right-nav, #topnav, #app with all sections, footer -->
  <!-- REMOVED: the entire <style> block (lines 15-1486) -->
  <!-- REMOVED: the entire <script> block at the end (lines 2393-2794) -->

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

Note: The body content (all HTML elements, sections, SVGs) stays identical to the original `gio_portfolio_ultimate.html` — only the `<style>` tag and the closing `<script>` block are removed. This is the bulk of the file and will be copied verbatim.

- [ ] **Step 5: Run `npm install`**

Run: `cd "C:\Users\alghu\Downloads\My Portfolio" && npm install`
Expected: No errors, node_modules/ created with gsap + three + vite

---

### Task 2: Extract CSS — tokens.css

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `index.html` (remove `<style>` block)

- [ ] **Step 1: Create src/styles/tokens.css**

Extract lines 16-44 from the original HTML (`:root` variables and normal-mode `.nm-*` overrides):

```css
:root {
  --bg: #050508;
  --bg2: #09090f;
  --surface: rgba(255, 255, 255, 0.03);
  --border: rgba(255, 255, 255, 0.07);
  --border-hi: rgba(108, 99, 255, 0.4);
  --a1: #7c6eff;
  --a2: #00d4ff;
  --a3: #ff6ebc;
  --text: #e4e4f0;
  --muted: #5a5a72;
  --mono: 'JetBrains Mono', monospace;
  --sans: 'Inter', sans-serif;
  --head: 'Syne', sans-serif;
  --r: 14px;
  --glow1: rgba(124, 110, 255, 0.3);
  --glow2: rgba(0, 212, 255, 0.2);
  --nm-bg: #f8f8fc;
  --nm-bg2: #f0f0f8;
  --nm-surface: rgba(0, 0, 0, 0.03);
  --nm-border: rgba(0, 0, 0, 0.08);
  --nm-text: #0f0f1a;
  --nm-muted: #6b6b8a;
  --nm-a1: #5b4fcf;
  --nm-a2: #0099bb;
  --nm-a3: #cc4488;
}
```

- [ ] **Step 2: Verify the file was created**

Read `src/styles/tokens.css` to confirm content.

---

### Task 3: Extract CSS — base.css

**Files:**
- Create: `src/styles/base.css`

- [ ] **Step 1: Create src/styles/base.css**

Extract the reset, body, scrollbar, anchor, section layout, and shared `.section-label`/`.section-title`/`.sec-inner` styles from the original:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

::-webkit-scrollbar {
  width: 3px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--a1);
  border-radius: 2px;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  overflow-x: hidden;
  line-height: 1.7;
  transition: background 0.7s ease, color 0.7s ease;
}

body.normal-mode {
  background: var(--nm-bg);
  color: var(--nm-text);
  --bg: var(--nm-bg);
  --bg2: var(--nm-bg2);
  --surface: var(--nm-surface);
  --border: var(--nm-border);
  --text: var(--nm-text);
  --muted: var(--nm-muted);
  --a1: var(--nm-a1);
  --a2: var(--nm-a2);
  --a3: var(--nm-a3);
  --glow1: rgba(91, 79, 207, 0.15);
  --glow2: rgba(0, 153, 187, 0.15);
}

a {
  color: inherit;
  text-decoration: none;
}

section {
  padding: 8rem 8vw;
  position: relative;
  z-index: 1;
}

.section-label {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--a1);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-label::before {
  content: '';
  width: 28px;
  height: 1px;
  background: var(--a1);
}

.section-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.sec-inner {
  max-width: 1200px;
  margin: 0 auto;
}

#app {
  margin-right: 72px;
}

@media (max-width: 960px) {
  #app {
    margin-right: 0;
  }
  section {
    padding: 6rem 6vw;
  }
}
```

---

### Task 4: Extract CSS — component files (loader, cursor, nav, hero, about, skills, projects, process, resume, contact, footer)

**Files:**
- Create: `src/styles/components/loader.css`
- Create: `src/styles/components/cursor.css`
- Create: `src/styles/components/nav.css`
- Create: `src/styles/components/hero.css`
- Create: `src/styles/components/about.css`
- Create: `src/styles/components/skills.css`
- Create: `src/styles/components/projects.css`
- Create: `src/styles/components/process.css`
- Create: `src/styles/components/resume.css`
- Create: `src/styles/components/contact.css`
- Create: `src/styles/components/footer.css`

- [ ] **Step 1: Create src/styles/components/loader.css**

Extract lines 150-195 (loader styles, `.ld-logo`, `.ld-track`, `.ld-bar`, `.ld-pct`):

```css
#loader {
  position: fixed;
  inset: 0;
  z-index: 9997;
  background: #050508;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.ld-logo {
  font-family: var(--mono);
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.04em;
}

.ld-logo span {
  color: var(--a1);
}

.ld-track {
  width: 220px;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1px;
  overflow: hidden;
}

.ld-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--a1), var(--a2));
  width: 0%;
  border-radius: 1px;
}

.ld-pct {
  font-family: var(--mono);
  font-size: 0.7rem;
  color: var(--muted);
  letter-spacing: 0.1em;
}
```

- [ ] **Step 2: Create src/styles/components/cursor.css**

```css
.cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: none;
}

.cursor-dot {
  width: 6px;
  height: 6px;
  background: var(--a1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cursor-ring {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(124, 110, 255, 0.45);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  position: absolute;
  top: 0;
  left: 0;
  transition: width 0.3s, height 0.3s, border-color 0.3s;
}

body.normal-mode .cursor-dot {
  background: var(--a1);
}

body.normal-mode .cursor-ring {
  border-color: rgba(91, 79, 207, 0.35);
}
```

- [ ] **Step 3: Create src/styles/components/nav.css**

Extract right-nav (lines 291-364) and topnav (lines 366-461) styles:

```css
/* Right nav */
#right-nav {
  position: fixed;
  right: 0;
  top: 0;
  width: 72px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  z-index: 100;
  border-left: 1px solid var(--border);
  background: rgba(5, 5, 8, 0.5);
  backdrop-filter: blur(16px);
  transition: background 0.7s, border-color 0.7s;
}

body.normal-mode #right-nav {
  background: rgba(248, 248, 252, 0.7);
  border-color: var(--nm-border);
}

.rn-btn {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px 6px;
  border-radius: 6px;
  transition: color 0.3s, background 0.3s;
  position: relative;
}

.rn-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 0;
  background: var(--a1);
  transition: height 0.3s;
  border-radius: 2px;
}

.rn-btn.active,
.rn-btn:hover {
  color: var(--text);
}

body.normal-mode .rn-btn.active,
body.normal-mode .rn-btn:hover {
  color: var(--nm-text);
}

.rn-btn.active::before {
  height: 70%;
}

.rn-sep {
  width: 1px;
  height: 20px;
  background: var(--border);
  opacity: 0.5;
}

@media (max-width: 960px) {
  #right-nav {
    display: none;
  }
}

/* Top nav */
#topnav {
  position: fixed;
  top: 0;
  left: 0;
  right: 72px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.4rem 6vw;
  background: rgba(5, 5, 8, 0);
  border-bottom: 1px solid transparent;
  transition: background 0.4s, border-color 0.4s;
  backdrop-filter: blur(0px);
}

#topnav.scrolled {
  background: rgba(5, 5, 8, 0.85);
  border-color: var(--border);
  backdrop-filter: blur(20px);
}

body.normal-mode #topnav.scrolled {
  background: rgba(248, 248, 252, 0.9);
  border-color: var(--nm-border);
}

.nav-logo {
  font-family: var(--mono);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.03em;
}

.nav-logo span {
  color: var(--a1);
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

.nav-links a {
  font-family: var(--mono);
  font-size: 0.75rem;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  position: relative;
  transition: color 0.25s;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--a1);
  transition: width 0.25s;
}

.nav-links a:hover {
  color: var(--text);
}

.nav-links a:hover::after {
  width: 100%;
}

body.normal-mode .nav-links a:hover {
  color: var(--nm-text);
}

.nav-cta {
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 1.2rem;
  border: 1px solid var(--a1);
  border-radius: 6px;
  color: var(--a1);
  cursor: pointer;
  background: transparent;
  transition: background 0.2s, color 0.2s;
}

.nav-cta:hover {
  background: var(--a1);
  color: #fff;
}

@media (max-width: 600px) {
  .nav-links {
    display: none;
  }
}
```

- [ ] **Step 4: Create src/styles/components/hero.css**

Extract lines 469-676:

```css
#hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 8vw;
  position: relative;
  z-index: 1;
}

.hero-eyebrow {
  font-family: var(--mono);
  font-size: 0.78rem;
  color: var(--a2);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.8rem;
  opacity: 0;
}

.hero-eyebrow::before {
  content: '';
  width: 36px;
  height: 1px;
  background: var(--a2);
}

.hero-title {
  font-family: var(--sans);
  font-size: clamp(3rem, 8vw, 7rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.04em;
  margin-bottom: 2rem;
  max-width: 900px;
}

.hero-title .line {
  overflow: hidden;
  display: block;
}

.hero-title .word {
  display: inline-block;
}

.hero-title .accent {
  color: var(--a1);
}

.hero-title .stroke {
  -webkit-text-stroke: 2px var(--text);
  color: transparent;
}

body.normal-mode .hero-title .stroke {
  -webkit-text-stroke: 2px var(--nm-text);
}

.hero-sub {
  font-size: 1.05rem;
  color: var(--muted);
  max-width: 500px;
  margin-bottom: 3rem;
  opacity: 0;
  line-height: 1.85;
}

.hero-sub strong {
  color: var(--text);
  font-weight: 600;
}

body.normal-mode .hero-sub strong {
  color: var(--nm-text);
}

.hero-cta {
  display: flex;
  gap: 1.2rem;
  align-items: center;
  opacity: 0;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 2rem;
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  border: none;
  transition: transform 0.2s, box-shadow 0.2s, background 0.3s, color 0.3s;
  text-decoration: none;
}

.btn-primary {
  background: var(--a1);
  color: #fff;
  box-shadow: 0 0 28px var(--glow1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 50px var(--glow1);
}

.btn-ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  border-color: var(--a2);
  color: var(--a2);
  transform: translateY(-2px);
}

body.normal-mode .btn-ghost {
  color: var(--nm-text);
  border-color: var(--nm-border);
}

body.normal-mode .btn-ghost:hover {
  border-color: var(--a2);
  color: var(--a2);
}

.hero-scroll-cue {
  position: absolute;
  bottom: 2.5rem;
  left: 8vw;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--mono);
  font-size: 0.68rem;
  color: var(--muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0;
}

.hsc-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, var(--a2), transparent);
  animation: scPulse 2s ease-in-out infinite;
}

@keyframes scPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.hero-badge {
  position: absolute;
  bottom: 5rem;
  right: 10vw;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 0.55rem 1.1rem;
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--a2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--a2);
  animation: blink 1.6s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}

@media (max-width: 600px) {
  .hero-cta {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

- [ ] **Step 5: Create remaining component CSS files**

Repeat extraction for each remaining section:
- `about.css` — lines 737-821 (about-grid, about-text, about-stats, stat-card, about-tags, atag)
- `skills.css` — lines 864-919 (skills-grid, skill-card, skill-icon/name/desc, skill-bar) + lines 921-973 (rings-grid, ring-item, ring-svg, ring-fill) + lines 822-862 (hobbies-grid, hobby-card for normal mode)
- `projects.css` — lines 975-1117 (projects-grid, project-card, project-thumb, project-info, project-tags, project-arrow, code-snip)
- `process.css` — lines 1119-1181 (process-steps, process-step, step-num, step-content)
- `resume.css` — lines 1183-1246 (timeline, tl-item, tl-dot, tl-date, tl-role, tl-company, tl-desc)
- `contact.css` — lines 1248-1378 (contact-email, social-row, soc-link, contact-form, form-row, form-field, form-submit)
- `footer.css` — lines 1380-1415 (footer styles)

---

### Task 5: Extract CSS — utilities.css

**Files:**
- Create: `src/styles/utilities.css`

- [ ] **Step 1: Create src/styles/utilities.css**

Extract noise overlay (lines 102-111), wave divider (lines 1403-1415), `.dev-only`/`.normal-only` (lines 717-734), media queries (lines 1424-1485), plus the SVG-related styles (lines 1417-1422):

```css
/* Noise overlay */
.noise {
  position: fixed;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

/* Dev / Normal mode visibility */
.dev-only {
  transition: opacity 0.5s, transform 0.5s;
  display: block;
}

.normal-only {
  transition: opacity 0.5s, transform 0.5s;
  display: block;
}

body.normal-mode .dev-only {
  display: none !important;
}

body:not(.normal-mode) .normal-only {
  display: none !important;
}

/* Wave divider */
.wave-div {
  width: 100%;
  overflow: hidden;
  line-height: 0;
  margin-right: 72px;
  position: relative;
  z-index: 1;
}

.wave-div svg {
  display: block;
}

@media (max-width: 960px) {
  .wave-div {
    margin-right: 0;
  }
}

/* Circuit SVG */
#svg-circuit {
  width: 100%;
  max-width: 420px;
  filter: drop-shadow(0 0 24px rgba(0, 212, 255, 0.14));
}

/* BG Canvas */
#bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.7s;
}

/* Liquid blob */
#liquid-wrap {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 280px;
  height: 280px;
  pointer-events: none;
  z-index: 4;
  transform: translate(60%, 60%);
  transition: opacity 0.5s;
}

#liquid-wrap svg {
  width: 100%;
  height: 100%;
}

/* Mode switch */
#mode-switch {
  position: fixed;
  top: 50%;
  right: 80px;
  transform: translateY(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ms-label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  transition: color 0.4s;
}

.ms-label.active {
  color: var(--a1);
}

body.normal-mode .ms-label.active {
  color: var(--a1);
}

.ms-track {
  width: 22px;
  height: 52px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  position: relative;
  transition: border-color 0.4s, background 0.4s;
}

.ms-track:hover {
  border-color: var(--a1);
}

.ms-thumb {
  width: 14px;
  height: 14px;
  background: var(--a1);
  border-radius: 50%;
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  transition: top 0.4s cubic-bezier(.68, -0.55, .27, 1.55), background 0.4s;
}

body.normal-mode .ms-thumb {
  top: 34px;
  background: var(--nm-a1);
}

body.normal-mode .ms-track {
  border-color: var(--nm-a1);
}

@media (max-width: 960px) {
  #mode-switch {
    right: 20px;
  }
}

/* Footer base */
footer {
  position: relative;
  z-index: 1;
  padding: 2rem 8vw;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-right: 72px;
}

footer p,
footer span {
  font-family: var(--mono);
  font-size: 0.72rem;
  color: var(--muted);
}

footer .acc {
  color: var(--a1);
}

@media (max-width: 960px) {
  footer {
    margin-right: 0;
  }
}

/* Responsive shared */
@media (max-width: 960px) {
  .about-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .skills-grid {
    grid-template-columns: 1fr 1fr;
  }
  .projects-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .skills-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .contact-form {
    padding: 2rem 1.5rem;
  }
}
```

---

### Task 6: Create main.js entry point

**Files:**
- Create: `src/main.js`
- Create: `src/styles/style.css` (import hub)

- [ ] **Step 1: Create src/styles/style.css**

This is the CSS import hub:

```css
@import './tokens.css';
@import './base.css';
@import './components/loader.css';
@import './components/cursor.css';
@import './components/nav.css';
@import './components/hero.css';
@import './components/about.css';
@import './components/skills.css';
@import './components/projects.css';
@import './components/process.css';
@import './components/resume.css';
@import './components/contact.css';
@import './components/footer.css';
@import './utilities.css';
```

- [ ] **Step 2: Create src/main.js**

```js
import './styles/style.css'
import { initLoader } from './js/modules/loader.js'
import { initThreeBg } from './js/modules/three-bg.js'
import { initCursor } from './js/modules/cursor.js'
import { initBlob } from './js/modules/blob.js'
import { initModeToggle } from './js/modules/mode-toggle.js'
import { initNavigation } from './js/modules/navigation.js'
import { initAnimations } from './js/modules/animations.js'
import { initHelpers } from './js/utils/helpers.js'

document.addEventListener('DOMContentLoaded', () => {
  initThreeBg()
  initCursor()
  initBlob()
  initModeToggle()
  initNavigation()
  initHelpers()
  initLoader(() => {
    initAnimations()
  })
})
```

---

### Task 7: Extract JS — loader.js

**Files:**
- Create: `src/js/modules/loader.js`

- [ ] **Step 1: Create src/js/modules/loader.js**

Extract the loader IIFE (lines 2399-2418). The loader takes an `onComplete` callback to start animations after the loader finishes:

```js
export function initLoader(onComplete) {
  const lbar = document.getElementById('lbar')
  const lpct = document.getElementById('lpct')
  const loader = document.getElementById('loader')
  let p = 0
  const iv = setInterval(() => {
    p += Math.random() * 18
    if (p >= 100) { p = 100; clearInterval(iv) }
    lbar.style.width = p + '%'
    lpct.textContent = Math.floor(p) + '%'
    if (p === 100) {
      setTimeout(() => {
        gsap.to(loader, {
          opacity: 0, duration: 0.8, ease: 'power2.inOut',
          onComplete: () => { loader.style.display = 'none'; onComplete() }
        })
      }, 300)
    }
  }, 55)
}
```

---

### Task 8: Extract JS — three-bg.js

**Files:**
- Create: `src/js/modules/three-bg.js`

- [ ] **Step 1: Create src/js/modules/three-bg.js**

Extract the Three.js background IIFE (original lines 2423-2502):

```js
import * as THREE from 'three'
import gsap from 'gsap'

export function initThreeBg() {
  const canvas = document.getElementById('bg-canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 18

  scene.add(new THREE.AmbientLight(0x7c6eff, 0.4))
  const pA = new THREE.PointLight(0x7c6eff, 2.5, 70); pA.position.set(-10, 10, 10); scene.add(pA)
  const pB = new THREE.PointLight(0x00d4ff, 2, 70); pB.position.set(10, -10, 5); scene.add(pB)

  const geos = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.7, 0.24, 8, 22),
    new THREE.OctahedronGeometry(0.9, 0),
    new THREE.TorusKnotGeometry(0.5, 0.17, 60, 8),
    new THREE.TetrahedronGeometry(1, 0),
  ]
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x7c6eff, wireframe: true, transparent: true, opacity: 0.55 }),
    new THREE.MeshStandardMaterial({ color: 0x00d4ff, wireframe: false, transparent: true, opacity: 0.10, roughness: 0.2, metalness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0xff6ebc, wireframe: true, transparent: true, opacity: 0.4 }),
  ]

  const meshes = []
  const COUNT = 24
  for (let i = 0; i < COUNT; i++) {
    const geo = geos[Math.floor(Math.random() * geos.length)]
    const mat = mats[Math.floor(Math.random() * mats.length)].clone()
    const mesh = new THREE.Mesh(geo, mat)
    const spread = 32
    mesh.position.set((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 12)
    const s = 0.3 + Math.random() * 1.5
    mesh.scale.setScalar(s)
    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.007, rotY: (Math.random() - 0.5) * 0.009, rotZ: (Math.random() - 0.5) * 0.006,
      originX: mesh.position.x, originY: mesh.position.y, phase: Math.random() * Math.PI * 2,
    }
    scene.add(mesh)
    meshes.push(mesh)
  }

  let mx = 0, my = 0
  document.addEventListener('mousemove', e => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2 })

  let t = 0
  function animate() {
    requestAnimationFrame(animate); t += 0.008
    meshes.forEach(m => {
      m.rotation.x += m.userData.rotX; m.rotation.y += m.userData.rotY; m.rotation.z += m.userData.rotZ
      m.position.x = m.userData.originX + Math.sin(t + m.userData.phase) * 1.4
      m.position.y = m.userData.originY + Math.cos(t + m.userData.phase * 1.3) * 1.1
    })
    camera.position.x += (mx * 1.4 - camera.position.x) * 0.018
    camera.position.y += (-my * 1.4 - camera.position.y) * 0.018
    camera.lookAt(scene.position)
    renderer.render(scene, camera)
  }
  animate()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  window._threeSetNormal = function (isNormal) {
    meshes.forEach(m => {
      const targetOpacity = isNormal ? 0.08 : (m.material.wireframe ? 0.5 : 0.1)
      gsap.to(m.material, { opacity: targetOpacity, duration: 1 })
      if (isNormal) {
        const nc = isNormal ? 0x5b4fcf : 0x7c6eff
        m.material.color.setHex(nc)
      }
    })
  }
}
```

---

### Task 9: Extract JS — cursor.js

**Files:**
- Create: `src/js/modules/cursor.js`

- [ ] **Step 1: Create src/js/modules/cursor.js**

Extract cursor IIFE (original lines 2507-2522):

```js
import gsap from 'gsap'

export function initCursor() {
  const cursor = document.getElementById('cursor')
  const dot = cursor.querySelector('.cursor-dot')
  const ring = cursor.querySelector('.cursor-ring')
  let mx = 0, my = 0, rx = 0, ry = 0
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.11; ry += (my - ry) * 0.11
    gsap.set(dot, { x: mx, y: my })
    gsap.set(ring, { x: rx, y: ry })
  })
  document.querySelectorAll('a,button,.project-card,.skill-card,.hobby-card,.stat-card').forEach(el => {
    el.addEventListener('mouseenter', () => gsap.to(ring, { scale: 1.9, opacity: 0.5, duration: 0.3 }))
    el.addEventListener('mouseleave', () => gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 }))
  })
}
```

---

### Task 10: Extract JS — blob.js

**Files:**
- Create: `src/js/modules/blob.js`

- [ ] **Step 1: Create src/js/modules/blob.js**

Extract liquid blob IIFE (original lines 2527-2557):

```js
export function initBlob() {
  const wrap = document.getElementById('liquid-wrap')
  const bMain = document.getElementById('blob-main')
  const bA = document.getElementById('blob-a')
  const bB = document.getElementById('blob-b')
  const bC = document.getElementById('blob-c')
  let mx = window.innerWidth - 140, my = window.innerHeight - 140
  let cx = mx, cy = my
  let bax = 140, bay = 100, bbx = 170, bby = 152, bcx = 110, bcy = 158
  let t = 0
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
  function updateBlob() {
    cx += (mx - cx) * 0.1; cy += (my - cy) * 0.1
    wrap.style.left = cx + 'px'; wrap.style.top = cy + 'px'
    wrap.style.transform = 'translate(-50%,-50%)'
    t++
    bax += (140 + Math.sin(t * 0.025) * 30 - bax) * 0.07
    bay += (100 + Math.cos(t * 0.02) * 20 - bay) * 0.07
    bMain.setAttribute('r', 46 + Math.sin(t * 0.04) * 6)
    bA.setAttribute('cx', bax); bA.setAttribute('cy', bay)
    bA.setAttribute('r', 22 + Math.sin(t * 0.05 + 1) * 5)
    bbx += (170 + Math.cos(t * 0.018) * 22 - bbx) * 0.06
    bby += (152 + Math.sin(t * 0.022) * 18 - bby) * 0.06
    bB.setAttribute('cx', bbx); bB.setAttribute('cy', bby)
    bcx += (110 + Math.sin(t * 0.03 + 2) * 18 - bcx) * 0.08
    bcy += (158 + Math.cos(t * 0.026) * 14 - bcy) * 0.08
    bC.setAttribute('cx', bcx); bC.setAttribute('cy', bcy)
    requestAnimationFrame(updateBlob)
  }
  updateBlob()
}
```

---

### Task 11: Extract JS — mode-toggle.js

**Files:**
- Create: `src/js/modules/mode-toggle.js`

- [ ] **Step 1: Create src/js/modules/mode-toggle.js**

Extract mode toggle (original lines 2562-2592):

```js
import gsap from 'gsap'

export function initModeToggle() {
  let isNormal = false
  const msTrack = document.getElementById('ms-track')
  const msTop = document.getElementById('ms-top')
  const msBot = document.getElementById('ms-bot')

  msTrack.addEventListener('click', () => {
    isNormal = !isNormal
    gsap.to('#app', {
      opacity: 0, duration: 0.25, onComplete: () => {
        document.body.classList.toggle('normal-mode', isNormal)
        if (window._threeSetNormal) window._threeSetNormal(isNormal)
        const stop0 = document.querySelector('#bgrad stop')
        if (stop0) stop0.style.stopColor = isNormal ? '#5b4fcf' : '#7c6eff'
        msTop.textContent = isNormal ? 'Normal' : 'Dev'
        msBot.textContent = isNormal ? 'Dev' : 'Normal'
        msTop.classList.toggle('active', !isNormal)
        msBot.classList.toggle('active', isNormal)
        gsap.to('#app', { opacity: 1, duration: 0.4, ease: 'power2.out' })
        setTimeout(() => {
          document.querySelectorAll('.skill-bar').forEach(bar => {
            const w = bar.getAttribute('data-width') || 80
            bar.style.width = '0%'
            setTimeout(() => { bar.style.width = w + '%'; bar.style.transition = 'width 1.2s ease' }, 50)
          })
        }, 350)
      }
    })
  })
}
```

---

### Task 12: Extract JS — navigation.js

**Files:**
- Create: `src/js/modules/navigation.js`

- [ ] **Step 1: Create src/js/modules/navigation.js**

Extract right-nav and top-nav scroll (original lines 2597-2623):

```js
export function initNavigation() {
  /* Right nav buttons */
  document.querySelectorAll('.rn-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.target
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.querySelectorAll('.rn-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  /* Scroll spy */
  const sectionEls = document.querySelectorAll('[id]')
  const rnObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.rn-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.target === e.target.id)
        })
      }
    })
  }, { threshold: 0.45 })
  sectionEls.forEach(s => rnObs.observe(s))

  /* Top nav scroll */
  window.addEventListener('scroll', () => {
    document.getElementById('topnav').classList.toggle('scrolled', window.scrollY > 60)
  })
}
```

---

### Task 13: Extract JS — animations.js

**Files:**
- Create: `src/js/modules/animations.js`

- [ ] **Step 1: Create src/js/modules/animations.js**

Extract the `initAnimations` function (original lines 2628-2793). This is the largest JS section — all GSAP/ScrollTrigger entrance animations:

```js
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initAnimations() {
  /* Hero entrance */
  const heroTl = gsap.timeline({ delay: 0.1 })
  heroTl
    .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    .from('.hero-title .word', { y: '110%', skewY: 5, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, '-=0.5')
    .to('.hero-sub', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4')
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    .to('.hero-scroll-cue', { opacity: 1, duration: 0.6 }, '-=0.3')
    .to('.hero-badge', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')

  /* Hero parallax */
  gsap.to('.hero-title', {
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
    y: -80, opacity: 0.3
  })

  /* About */
  gsap.from('.about-text > *', {
    scrollTrigger: { trigger: '#about', start: 'top 72%' },
    opacity: 0, y: 40, duration: 0.8, stagger: 0.11, ease: 'power2.out'
  })
  gsap.from('.stat-card', {
    scrollTrigger: { trigger: '.about-stats', start: 'top 80%' },
    opacity: 0, scale: 0.88, duration: 0.6, stagger: 0.08, ease: 'back.out(1.5)'
  })
  gsap.from('#svg-circuit, #about-svg', {
    scrollTrigger: { trigger: '#about', start: 'top 70%' },
    opacity: 0, x: 60, duration: 1.1, ease: 'power3.out'
  })

  /* Circuit board draw-on */
  const cTL = gsap.timeline({ scrollTrigger: { trigger: '#about', start: 'top 62%' } })
  cTL
    .to('#active-h1', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' })
    .to('#active-v1', { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '-=0.3')
    .to('#active-h2', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, '-=0.3')
  gsap.from('.node', {
    scrollTrigger: { trigger: '#about', start: 'top 62%' },
    scale: 0, transformOrigin: 'center', duration: 0.5, stagger: 0.07, ease: 'back.out(3)'
  })
  gsap.to('.pulse-node', { scale: 1.6, opacity: 0.5, duration: 1.3, repeat: -1, yoyo: true, ease: 'sine.inOut', transformOrigin: 'center' })

  /* Counters */
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'))
    ScrollTrigger.create({
      trigger: el, start: 'top 82%', once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target, duration: 1.5, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(this.targets()[0].val) + '+' }
        })
      }
    })
  })

  /* Orbital SVG */
  const orbTl = gsap.timeline({ repeat: -1, yoyo: true })
  orbTl.to('#orb', { scale: 1.06, duration: 2.2, ease: 'sine.inOut', transformOrigin: 'center' })
  gsap.to(['#bracket-l', '#code-txt'], { y: -10, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true })
  gsap.to(['#bracket-r', '#code-txt2'], { y: 9, duration: 3.3, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.8 })
  gsap.to(['#deco1', '#deco2', '#deco3', '#deco4'], { rotation: 45, duration: 7, ease: 'none', repeat: -1, transformOrigin: 'center', stagger: 1.6 })

  orbitDot('dot1-nm', 170, 60, 200, 200, 6, 0)
  orbitDot('dot2-nm', 130, 45, 200, 200, 9, 0.33)
  orbitDot('dot3-nm', 90, 30, 200, 200, 5, 0.66)
  orbitDot('dot4-nm', 170, 60, 200, 200, 11, 0.5)

  /* Skill rings */
  const CIRC = 264
  document.querySelectorAll('.ring-item').forEach((item, i) => {
    const pct = parseInt(item.dataset.pct) / 100
    const ring = item.querySelector('.ring-fill')
    gsap.to(ring, {
      scrollTrigger: { trigger: '#skills-dev', start: 'top 72%' },
      strokeDashoffset: CIRC * (1 - pct), duration: 1.5, delay: i * 0.1, ease: 'power3.out'
    })
    gsap.from(item, {
      scrollTrigger: { trigger: '#skills-dev', start: 'top 72%' },
      opacity: 0, y: 30, duration: 0.7, delay: i * 0.09, ease: 'power2.out'
    })
  })

  /* Skill bars */
  document.querySelectorAll('.skill-bar').forEach(bar => {
    const w = bar.getAttribute('data-width') || 80
    ScrollTrigger.create({
      trigger: bar, start: 'top 88%', once: true,
      onEnter: () => gsap.to(bar, { width: w + '%', duration: 1.3, ease: 'power2.out', delay: 0.15 })
    })
  })

  /* Skill + hobby cards */
  gsap.from('.skill-card', {
    scrollTrigger: { trigger: '#skills-dev,#skills-normal', start: 'top 72%' },
    opacity: 0, y: 50, duration: 0.7, stagger: 0.09, ease: 'power3.out'
  })
  gsap.from('.hobby-card', {
    scrollTrigger: { trigger: '#hobbies', start: 'top 75%' },
    opacity: 0, y: 50, duration: 0.7, stagger: 0.1, ease: 'power3.out'
  })

  /* Projects */
  gsap.from('.project-card', {
    scrollTrigger: { trigger: '#projects', start: 'top 72%' },
    opacity: 0, y: 60, duration: 0.8, stagger: 0.13, ease: 'power3.out'
  })

  /* Wave paths animation */
  ['#wave1a', '#wave1b'].forEach((sel, i) => {
    const el = document.querySelector(sel)
    if (!el) return
    gsap.to(el, {
      attr: {
        d: i === 0
          ? 'M80 90 Q200 25 300 90 Q400 155 520 90'
          : 'M80 110 Q200 45 300 110 Q400 175 520 110'
      },
      duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.5
    })
  })

  /* Process steps */
  gsap.from('.process-step', {
    scrollTrigger: { trigger: '#process', start: 'top 72%' },
    opacity: 0, x: -40, duration: 0.7, stagger: 0.13, ease: 'power2.out'
  })

  /* Timeline items */
  gsap.from('.tl-item', {
    scrollTrigger: { trigger: '#resume', start: 'top 75%' },
    opacity: 0, x: -25, duration: 0.7, stagger: 0.12, ease: 'power2.out'
  })

  /* Section titles */
  document.querySelectorAll('.section-title').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0, y: 32, duration: 0.9, ease: 'power2.out'
    })
  })

  /* Contact form */
  gsap.from('.contact-form > *,#contact > *', {
    scrollTrigger: { trigger: '#contact', start: 'top 72%' },
    opacity: 0, y: 35, duration: 0.8, stagger: 0.09, ease: 'power2.out'
  })

  /* Mouse glow */
  const glow = document.createElement('div')
  glow.style.cssText = 'position:fixed;width:700px;height:700px;border-radius:50%;pointer-events:none;z-index:0;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(124,110,255,0.06),transparent 70%)'
  document.body.appendChild(glow)
  const xTo = gsap.quickTo(glow, 'x', { duration: 0.8, ease: 'power3' })
  const yTo = gsap.quickTo(glow, 'y', { duration: 0.8, ease: 'power3' })
  window.addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY) })
}

function orbitDot(id, rx, ry, cx, cy, dur, off) {
  gsap.to({}, {
    duration: dur, repeat: -1, ease: 'none',
    onUpdate: function () {
      const t = (this.progress() + off) * Math.PI * 2
      const el = document.getElementById(id)
      if (el) { el.setAttribute('cx', cx + Math.cos(t) * rx); el.setAttribute('cy', cy + Math.sin(t) * ry) }
    }
  })
}
```

---

### Task 14: Extract JS — helpers.js

**Files:**
- Create: `src/js/utils/helpers.js`

- [ ] **Step 1: Create src/js/utils/helpers.js**

```js
export function initHelpers() {
  // Placeholder for any shared utility functions
  // Currently, orbitDot is used in animations.js as a module-scoped function
}
```

Note: `orbitDot()` is kept as a module-private function inside `animations.js` since it's only used there. If more utilities emerge later, they can be added here.

---

### Task 15: Update index.html — remove inline style and script

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove the inline `<style>` block**

Delete everything from the opening `<style>` tag (line 15 in original) to the closing `</style>` tag (line 1486 in original). These styles are now in the CSS modules.

- [ ] **Step 2: Remove the inline `<script>` block**

Delete everything from the opening `<script>` tag (line 2393 in original) to the closing `</script>` tag (line 2794 in original). This JS is now in the JS modules.

- [ ] **Step 3: Add the module script tag**

At the end of `<body>`, add:
```html
<script type="module" src="/src/main.js"></script>
```

- [ ] **Step 4: Verify the file runs correctly**

Run: `cd "C:\Users\alghu\Downloads\My Portfolio" && npx vite --host`
Open the URL in a browser. The page should load with all styles and animations working.

---

### Task 16: Move image files

**Files:**
- Move: `assets/images/picture-wacky.png` (renamed from `Picture wacky .png`)
- Move: `assets/images/picture.jpeg` (renamed from `Picture.jpeg`)

- [ ] **Step 1: Create assets directory structure**

Run: `New-Item -ItemType Directory -Path "src\assets\images" -Force`

- [ ] **Step 2: Move images**

Run: `Move-Item -LiteralPath "Picture wacky .png" -Destination "src\assets\images\picture-wacky.png" -Force`
Run: `Move-Item -LiteralPath "Picture.jpeg" -Destination "src\assets\images\picture.jpeg" -Force`

- [ ] **Step 3: Update any image references in index.html**

If the HTML references these images, update the paths to `src/assets/images/picture-wacky.png` etc.

---

### Task 17: Verify the build

**Files:**
- Run: `npm run build`

- [ ] **Step 1: Run production build**

Run: `cd "C:\Users\alghu\Downloads\My Portfolio" && npm run build`
Expected: No errors, `dist/` directory created with bundled CSS/JS.

- [ ] **Step 2: Preview the build**

Run: `cd "C:\Users\alghu\Downloads\My Portfolio" && npx vite preview`
Expected: Page loads correctly from the production bundle.
