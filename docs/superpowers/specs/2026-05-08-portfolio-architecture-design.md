# Portfolio Architecture — Vite + Vanilla JS

## Goal

Restructure the monolithic `gio_portfolio_ultimate.html` (2797 lines with inline CSS/JS/SVG) into a maintainable, Vite-powered project with modular files grouped by concern.

## Stack

- **Vite** — dev server with HMR, production bundling
- **Vanilla JS** — no framework; existing Three.js/GSAP code stays as-is
- **CSS custom properties** — already in use for theming, just extracted to files

## File Structure

```
my-portfolio/
├── index.html                  # Minimal entry — imports src/main.js
├── package.json
├── vite.config.js
├── src/
│   ├── main.js                 # Orchestrator: imports CSS, inits all modules
│   │
│   ├── styles/
│   │   ├── tokens.css          # CSS custom properties (colors, fonts, radii, tokens)
│   │   ├── base.css            # Reset, body, scrollbar, shared section layout
│   │   ├── components/
│   │   │   ├── loader.css
│   │   │   ├── cursor.css
│   │   │   ├── nav.css         # topnav + right-nav
│   │   │   ├── hero.css
│   │   │   ├── about.css
│   │   │   ├── skills.css      # Dev skill rings + skill cards (both modes)
│   │   │   ├── projects.css
│   │   │   ├── process.css
│   │   │   ├── resume.css
│   │   │   ├── contact.css
│   │   │   └── footer.css
│   │   └── utilities.css       # noise overlay, wave dividers, responsive queries
│   │
│   ├── js/
│   │   ├── modules/
│   │   │   ├── loader.js       # Fake progress loader → initAnimations()
│   │   │   ├── three-bg.js     # Three.js scene, wireframe meshes, pointer tracking
│   │   │   ├── cursor.js       # Custom cursor dot + ring follower
│   │   │   ├── blob.js         # Liquid goo blob SVG (right-side cursor)
│   │   │   ├── mode-toggle.js  # Dev ↔ Normal mode toggle, theme switching
│   │   │   ├── navigation.js   # Right-nav scroll spy + top-nav scroll detection
│   │   │   └── animations.js   # All GSAP/ScrollTrigger entrance animations
│   │   └── utils/
│   │       └── helpers.js      # orbitDot(), counter animation, shared utilities
│   │
│   └── assets/
│       ├── images/
│       │   ├── picture-wacky.png
│       │   └── picture.jpeg
│       └── svg/
│           ├── circuit-board.svg
│           ├── orbital.svg
│           └── social-icons.svg
│
└── public/
    └── favicon.ico
```

## Module Responsibilities

| Module | What it owns |
|--------|-------------|
| `main.js` | Imports `style.css`, calls all module initializers, exposes `initAnimations` |
| `loader.js` | Fake progress bar, hides loader, invokes `initAnimations()` callback |
| `three-bg.js` | Three.js renderer, scene, camera, meshes, pointer tracking, resize handler |
| `cursor.js` | Custom cursor dot + ring, GSAP ticker follower, hover scaling on interactive elements |
| `blob.js` | Liquid blob SVG circles with goo filter, RAF-based animation |
| `mode-toggle.js` | Click handler on `#ms-track`, toggles `normal-mode` class, updates Three.js opacity |
| `navigation.js` | Right-nav button clicks → scrollIntoView, IntersectionObserver for active state, top-nav scroll class |
| `animations.js` | All GSAP/ScrollTrigger: hero entrance, counter, skill rings/bars, cards stagger, SVGs, parallax |
| `helpers.js` | `orbitDot()` function, shared animation utility functions |

## CSS Architecture

- **tokens.css** — `:root` variables (both dark and normal mode overrides)
- **base.css** — `*` reset, `html`/`body`, scrollbar, anchor styles, section/`.sec-inner`/`.section-label`/`.section-title` shared styles
- **component css** — one file per section, purely the section's styles extracted from the monolithic `<style>` block
- **utilities.css** — `.noise`, `.wave-div`, `@media` queries, `.dev-only`/`.normal-only` visibility classes

## HTML Changes

- Extract all `<style>` content to CSS files
- Remove inline `<script>` block; modules import via ES modules
- Keep DOM structure identical — no structural changes
- **SVG handling:** SVGs with GSAP-animated internal elements (circuit board `#active-h1`, orbital `#orb`, project thumbnails with `<path>` animation, etc.) remain inline in the HTML. Static/decorative SVGs (social icons, standalone section icons) are extracted to `assets/svg/` and loaded via `<img>` or `<use>`.

## Boundaries & Interfaces

- Each JS module exports a single init function (e.g. `initCursor()`, `initThreeBg()`)
- `main.js` calls them all after DOM ready
- `animations.js`'s `initAnimations()` is called by `loader.js` after the loader finishes
- `mode-toggle.js` calls `window._threeSetNormal()` to communicate theme changes to the Three.js module

## Non-Goals

- No React, Vue, Svelte, or any framework
- No CSS preprocessor (plain CSS via Vite)
- No routing (single-page, section-based)
- No build-time optimization of SVGs (just extraction)
