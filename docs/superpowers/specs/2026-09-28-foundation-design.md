# Phase 1: Foundation for the redesign (the `/lab` link, one container, CSS housekeeping)

## Context
The site is live (main @ `6172190`). The user wants a real visual redesign aimed at **clients**. The agreed order is:
1. Foundation (this phase)
2. Stryg.Bytes client redesign
3. Gio redesign

Each phase gets a report and then a STOP.

Today clients can't be sent straight to the lab: Gio is always the default and the mode is never in the URL. Section widths are inconsistent (1100/1120/1180/1200px), and all of Gio is styled by one 983-line `profile.css`. This phase fixes those problems. Apart from the small width alignment in B, nothing visual changes.

**Once this is approved:** I save this spec as `docs/superpowers/specs/2026-09-28-foundation-design.md` on the new branch `feat/foundation` (from `main`) and commit it. I then write the implementation plan with the writing-plans skill, and code starts only after that plan is approved.

## A. Mode routing: `/lab`
- **New helper:** `src/js/modules/mode-route.js` exports:
  - `modeFromPath(pathname)`, which returns `'lab'` for `/lab` or `/lab/` and `'gio'` for anything else.
  - `pathForMode(mode)`.
  - `applyModeMeta(mode)`, which sets `document.title`, `link[rel=canonical]` and `meta[property=og:url]` from existing wording only.
- **First load:** `src/main.js` currently adds `body.normal-mode` on DOMContentLoaded unconditionally. It will add the class only when the mode is `'gio'`. For `/lab`, it runs the dev init path instead: the grid loader branded "Stryg.Bytes", the lazy hero bot and the dev particles, with no PixelBlast or typewriter.
- **Toggle:** `src/js/modules/mode-toggle.js` seeds its `isNormal` flag from `modeFromPath` instead of hard-coding `true`. After each toggle it calls `history.pushState(null, '', pathForMode(...))` and `applyModeMeta`.
- **Back/Forward:** a `popstate` listener switches the mode when the path's mode differs from the current one.
- **Section anchors:** in-page hashes such as `/lab#projects` keep working.
- **Sitemap:** add `/lab` to `public/sitemap.xml`.
- **No server change:** the catch-all in `server/app.js:69-72` already serves `dist/index.html` for `/lab`, and Vite's SPA fallback covers dev.

## B. One layout container
- **Tokens:** add `--container: 1200px` and `--container-narrow: 1100px` to `src/styles/tokens.css`, plus a `.container` utility in `utilities.css`.
- **Width mapping:**
  - 1200 (`base.css:131`) → `--container`
  - 1180 (three places in `profile.css`) → `--container`
  - 1100 (`projects.css:7,83`, `testimonials.css:110`) → `--container-narrow`
  - 1120 (`skills.css:102`) → `--container-narrow`
- **Visible delta:** the Gio sections widen by 20px and the dev skills block narrows by 20px. Nothing else changes.

## C. CSS housekeeping (only what the redesign needs)
- **Split `profile.css`:** split `src/styles/components/profile.css` into `src/styles/components/gio/{cover,about,whatido,resume,skills,portfolio,certs,hobbies,contact}.css`. The rules stay byte-identical; only their location changes. Import order is kept in `src/styles/style.css`.
- **Mode visibility:** delete the ID-based dev-section hiding in `profile.css` (lines 7–17). `#hero`, `#about` and `#contact` get the `.dev-only` class (`#skills-dev` and `#projects` already have it), so `.dev-only` / `.normal-only` in `utilities.css` is the only mechanism.
- **Inline styles:** move the 8 inline `style=""` attributes in `index.html` into classes:
  - `#about` and `#projects` get `bg2`.
  - The about-visual wrappers get classes.
  - The four `.project-thumb` gradients become `--thumb-*` modifier classes.
- **Out of scope:** the scattered `body.normal-mode X` overrides in nav, hero and contact are left alone, because Phases 2 and 3 rewrite those files.

## Testing / verification
1. **Unit:** `tests/mode-route.test.mjs` covers `modeFromPath` and `pathForMode`, including trailing slash, `/lab#x` and unknown paths. It runs under the existing `npm test` (`node --test tests/*.test.mjs`).
2. **Server:** in `tests/server.test.mjs`, `GET /lab` returns 200 HTML when `dist` exists.
3. **Visual parity:** chrome-devtools screenshots of both modes at 390, 768 and 1280px, taken before and after. They must match except for the ±20px container shift in B.
4. **Browser:**
   - `/lab` loads straight into Stryg.Bytes, and a reload keeps it there.
   - Switching modes updates the URL and the tab title.
   - Back and Forward switch the mode.
   - `/lab#projects` scrolls to projects.
   - The console is clean.
5. **Gate:** `npm test` and `npm run build` pass. The local API uses a scratch `DB_FILE`, so the tracked `server/portfolio.db` is never touched.
6. **Handoff:** report, then STOP. The push to `main` and the Phase 2 kickoff wait for the user.

## Notes
- GateGuard asks for facts before the first edit of each file and blocks `git checkout --`. Restore files with `git show HEAD:path > path` instead.
- Stop the dev servers by port afterwards. TaskStop leaves node children running.
