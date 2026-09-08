# Stryg.Bytes — Portfolio

Dual-mode portfolio for **Stryg.Bytes** (full-stack development studio) and **Gio** (personal IT Engineer profile), powered by a small self-hosted CMS.

## Tech Stack

### Frontend
- **Vite** 5 + vanilla JS
- **GSAP** + ScrollTrigger — loader, hero entrance, scroll animations, pinned Process timeline, text reveals
- **Lenis** — smooth scrolling
- **Canvas 2D** — Dev-mode background (layered gradient blobs, SVG film grain, particle field with mouse repulsion)
- **React + Three.js** — PixelBlast pixel-grid background (Normal mode)
- **CSS** custom properties — dark Dev theme + light Normal theme

### Backend (CMS)
- **Express 5** — REST API + static serving of built dist
- **better-sqlite3** — SQLite database (`portfolio.db`)
- **multer** — file uploads (project screenshots, client logos, certificate images + PDFs)
- **jsonwebtoken + bcryptjs** — JWT admin authentication
- Admin SPA at `/admin` for managing projects, testimonials, client logos, certificates, and the review inbox

## Features

- **Dual mode** (Dev / Normal) — Stryg.Bytes studio vs personal IT Engineer profile
- **Grid loading screen** — Stryg.Bytes glitch → 144-block grid wipe → hero reveal
- **Hero bot** — robot card in the Dev hero
- **Premium split hero** — asymmetric two-column layout with glass robot card (Dev mode)
- **"Why Stryg.Bytes" value cards / Services bento / Animated wave dividers / Process timeline** (Dev)
- **Personal gate** — "Meet Gio →" transition at the bottom of the Dev portfolio
- **Normal profile** — Facebook-style cover + profile header, light theme
- **API-driven content** — projects, testimonials, client logos, and certificates load from the CMS (with graceful static fallback)
- **Project categories** — Client Projects / SaaS Templates / Systems & Apps / Templates, with a filter bar and per-project screenshots
- **Client logos marquee** — logo images or text-only fallback
- **Certificates** — thumbnail image + optional PDF or external verification link (e.g. GSD Council), managed in admin
- **PixelBlast background** / **Lenis smooth scroll** / **Scroll-triggered text reveals**

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server only (frontend) |
| `npm run server` | Run the Express backend on `:5175` |
| `npm run dev:full` | Run backend + Vite dev together (recommended for development) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run seed` | Start backend (seeds database on first run) |

During development, Vite proxies `/api` and `/uploads` to the backend at `localhost:5175`.

## CMS & Admin

- **Admin panel**: `http://localhost:5175/admin` (dev), or `/admin` behind the backend in production.
- **Default credentials** (development only): `admin` / `admin123`.
  - ⚠️ Create `server/.env` with a real `ADMIN_PASS` and a long random `JWT_SECRET` before any production/full-stack deploy.
- **Login route**: `POST /api/auth/login` → returns a JWT (7-day expiry).
- **Managed content**:
  - Projects — name, description, tags, category, live URL, demo URL, screenshot, thumb style, sort
  - Testimonials — name, role, quote, stars (approve from the Reviews inbox or add manually)
  - Client logos — name + image, sort, show/hide
  - Certificates — name, issuer, date, thumbnail image, PDF, verification link, sort, show/hide
  - Reviews — public submission page (`/review?c=<name>`) + approve/delete in admin
- **Uploads** live in `server/public/uploads/` (gitignored user content), served at `/uploads`.

## Env Variables (`server/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5175` | Backend port |
| `DB_FILE` | `server/portfolio.db` | SQLite database path |
| `UPLOAD_DIR` | `server/public/uploads` | Uploaded files directory (set to `/data/uploads` on Render) |
| `ADMIN_USER` | `admin` | Admin username |
| `ADMIN_PASS` | `admin123` | Admin password (set a real one) |
| `JWT_SECRET` | `dev-secret-change-me` | JWT signing secret (set a long random one) |
| `GIT_PAT` | *(unset → disabled)* | GitHub fine-grained PAT ("Contents: Read and write") enabling git pushback persistence |
| `GIT_CMS_REMOTE` | `github.com/joecel-hub/portfolio` | Repo the CMS snapshots are pushed to |
| `GIT_CMS_BRANCH` | `main` | Branch CMS snapshots are pushed to |

## CMS data persistence

Running the SQLite DB + uploads on the free tier means the filesystem is wiped on every redeploy. To keep CMS edits without a disk, the server can **push data back to the repo** after every write:

1. Seed `server/portfolio.db` (and optional `server/public/uploads/`) is committed and checked out on build.
2. `server/pushback.js` debounces ~3 s after any write, checkpoints the SQLite WAL, stages `portfolio.db` + uploads, and commits + pushes them to `GIT_CMS_REMOTE` on `GIT_CMS_BRANCH`.
3. That push triggers Render's auto-deploy, which checks out the updated snapshot — so content survives redeploys at zero cost.
4. On shutdown (`SIGTERM`/`SIGINT`) a synchronous best-effort flush is attempted.

Trade-off: every CMS save causes an auto-deploy (~1 min), and two overlapping deploys editing the same time can race (the push retries up to 3×).

## Sections

### Dev mode (Stryg.Bytes)
1. **Hero** (`#hero`) — "Welcome to the Studio" split layout with hero-bot card
2. **About** (`#about`) — "Why Stryg.Bytes" value proposition, stats bar
3. **Services** (`#skills-dev`) — premium bento cards
4. **Projects** (`#projects`) — featured work grid
5. **Process** (`#process`) — 5-step centered alternating timeline (pinned)
6. **Contact** (`#contact`) — form + social links (hidden in Normal mode)

### Normal mode (Gio)
Single profile page (`#profile`, light theme):
1. **Cover + header** — wide cover photo, avatar, name, typewriter role, actions, socials
2. **About** (`#pf-about`) — bio + services grid
3. **Resume** (`#pf-resume`) — experience timeline + skills with logos
4. **Portfolio** (`#pf-portfolio`) — filterable project grid (Client Projects / SaaS / Apps / Templates)
5. **Hobbies & Certificates** (`#pf-hobbies`) — hobby cards + certificate cards (managed in admin)
6. **Contact** (`#pf-contact`) — contact rows + form

## Project Structure

```
src/
├── main.js                   # Entry point
├── styles/
│   ├── tokens.css            # CSS custom properties (dev + --nm-* normal tokens)
│   ├── base.css              # Reset, body, normal-mode remapping
│   ├── utilities.css         # Wave dividers, mode visibility, noise
│   ├── responsive.css        # Breakpoints
│   └── components/           # Per-section CSS files
├── js/
│   └── modules/
│       ├── loader.js         # Grid loading screen
│       ├── api-content.js    # Loads projects/logos/testimonials/certificates from the API
│       ├── animations.js     # GSAP scroll animations + Process pin
│       ├── navigation.js / mode-toggle.js / profile.js / text-reveal.js / text-morph.js / text-type.js
│       ├── PixelBlast.jsx    # Three.js shader background (Normal)
│       └── mountPixelBlast.jsx
server/
├── index.js                  # Express app entry + route mounting + SPA fallback
├── db.js                     # SQLite schema, migrations, seeding
├── auth.js                   # JWT login + requireAuth middleware
├── middleware/upload.js      # multer config (images + PDFs)
├── routes/
│   ├── projects.js           # Project CRUD + screenshot upload
│   ├── testimonials.js       # Testimonial CRUD
│   ├── logos.js              # Client logo CRUD + image upload
│   ├── certificates.js       # Certificate CRUD + image/PDF upload
│   └── reviews.js            # Public submit + admin approve/delete
└── public/
    ├── admin/index.html      # Admin SPA (login + dashboard)
    ├── review/index.html     # Public review submission page
    └── uploads/              # User-uploaded files (gitignored)
```

## Deployment

The app is designed to run as **one full-stack service** — the Express server builds and serves the `dist/` frontend, the admin panel, and the API on a single origin.

- Source lives in a **private** GitHub repo (`joecel-hub/portfolio`, `main` branch).
- **Render (paid)**: `render.yaml` provisions a Web Service (Starter plan, Singapore region) with a 1 GB persistent disk mounted at `/data`. Build = `npm ci --include=dev && npm run build`, start = `npm run server`, health check = `/api/health`. Auto-deploys on push to `main`.
  - Set `ADMIN_PASS`, `JWT_SECRET`, and `GIT_PAT` as **secrets** in the Render dashboard. `DB_FILE=/data/portfolio.db` and `UPLOAD_DIR=/data/uploads` are set automatically so the DB and uploads survive redeploys.
- **Render (free, current)**: no disk is available, so persistence runs through **git pushback** (see [CMS data persistence](#cms-data-persistence)). Add the `GIT_PAT` secret to the service; set `DB_FILE`/`UPLOAD_DIR` to their defaults (inside the checkout) so the committed paths are the ones written and pushed back.
- **Local / dev**: `npm run dev:full` (or `npm run server`) — Vite proxies `/api` and `/uploads` to `localhost:5175`.
- `dist/`, `.vercel/`, `server/.env`, `server/*.db-wal` / `*.db-shm`, and the contents of `server/public/uploads/` are git-ignored. `server/portfolio.db` **is** committed (it is the pushback snapshot); do not commit `server/.env`.

## Notes

- Profile (`.section-title`) headings are excluded from the text-reveal system — they render through the profile entrance animation instead.
- Always call `ScrollTrigger.refresh()` after a mode switch so pinned sections recalculate.
