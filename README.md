# Stryg.Bytes — Portfolio

Dual-mode portfolio for **Stryg.Bytes** (full-stack development studio) and **Gio** (personal profile: IT Support Engineer | IT Infrastructure | Web Developer), powered by a small self-hosted CMS.

## Tech Stack

### Frontend
- **Vite** 8 + vanilla JS
- **GSAP** + ScrollTrigger — loader, hero entrance, scroll animations, pinned Process timeline, text reveals
- **Lenis** — smooth scrolling
- **Canvas 2D** — Dev-mode background (layered gradient blobs, SVG film grain, particle field with mouse repulsion)
- **React + Three.js** — PixelBlast pixel-grid background (Normal mode)
- **CSS** custom properties — dark Dev theme + light Normal theme

### Backend (CMS)
- **Express 5** — REST API + static serving of built dist
- **better-sqlite3** — SQLite database (`portfolio.db`)
- **multer** — file uploads (project screenshots, client logos, certificate images + PDFs, hobby clips)
- **nodemailer** — contact form email over SMTP
- **jsonwebtoken + bcryptjs** — JWT admin authentication
- Admin SPA at `/admin` for managing projects, testimonials, client logos, certificates, and the review inbox

## Features

- **Dual mode** (Dev / Normal) — Stryg.Bytes studio vs personal IT Support Engineer profile
- **Grid loading screen** — Stryg.Bytes glitch → 144-block grid wipe → hero reveal
- **Hero bot** — robot card in the Dev hero
- **Premium split hero** — asymmetric two-column layout with glass robot card (Dev mode)
- **"Why Stryg.Bytes" value cards / Services bento / Animated wave dividers / Process timeline** (Dev)
- **Mode switch** — floating G / S·B button (and "View Creative Work →") swaps between the Gio profile and the Stryg.Bytes studio
- **Normal profile (default)** — cover + profile header, light theme; this is the page visitors land on
- **Contact form** — posts to `/api/contact`, emailed via SMTP; shows an "email me directly" fallback when SMTP isn't configured
- **API-driven content** — projects, testimonials, client logos, and certificates load from the CMS (with graceful static fallback)
- **Project categories** — Client Projects / SaaS Templates / Systems & Apps / Templates, with a filter bar and per-project screenshots
- **Client logos marquee** — logo images or text-only fallback
- **Certificates** — thumbnail image + optional PDF or external verification link (e.g. GSD Council), managed in admin
- **PixelBlast background** / **Lenis smooth scroll** / **Scroll-triggered text reveals**
- **Self-hosted fonts** — JetBrains Mono, Inter and Syne are bundled as variable woff2 files (`src/assets/fonts/`), so no requests go to Google Fonts
- **Legal pages** — stand-alone `/privacy`, `/terms`, `/cookies` and `/refund` pages (see [Legal pages](#legal-pages))
- **Review consent** — the review form requires an explicit consent checkbox before submission; consent and timestamp are stored with the review

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server only (frontend) |
| `npm run server` | Run the Express backend on `:5175` |
| `npm run dev:full` | Run backend + Vite dev together (recommended for development) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run seed` | Start backend (seeds database on first run) |
| `npm test` | Run the backend integration test suite (`tests/`, Node's built-in runner) |

During development, Vite proxies `/api` and `/uploads` to the backend at `localhost:5175`.

## CMS & Admin

- **Admin panel**: `http://localhost:5175/admin` (dev), or `/admin` behind the backend in production.
- **Credentials**: there are no built-in defaults. Set `ADMIN_PASS` and `JWT_SECRET` in `server/.env` (copy `server/.env.example`); the server refuses to start without them.
  - ⚠️ Create `server/.env` with a real `ADMIN_PASS` and a long random `JWT_SECRET`. With `NODE_ENV=production` the server **refuses to start** if either is missing or still a default.
- **Login route**: `POST /api/auth/login` → returns a JWT (7-day expiry).
- **Managed content**:
  - Projects — name, description, tags, category, live URL, demo URL, screenshot, thumb style, sort
  - Testimonials — name, role, quote, stars (approve from the Reviews inbox or add manually)
  - Client logos — name + image, sort, show/hide
  - Certificates — name, issuer, date, thumbnail image, PDF, verification link, sort, show/hide
  - Reviews — public submission page (`/review?c=<name>`) + approve/delete in admin. Submitting requires ticking a **consent checkbox** (stored as `consent` + `consent_at`); submissions without consent are rejected.
- **Uploads** live in `UPLOAD_DIR` (`/data/uploads` on Render, `server/public/uploads/` locally), served at `/uploads`.

## Env Variables (`server/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5175` | Backend port |
| `DB_FILE` | `server/portfolio.db` | SQLite database path |
| `UPLOAD_DIR` | `server/public/uploads` | Uploaded files directory (set to `/data/uploads` on Render) |
| `ADMIN_USER` | `admin` | Admin username |
| `ADMIN_PASS` | *(required)* | Admin password (set a real one) |
| `JWT_SECRET` | *(required)* | JWT signing secret (set a long random one) |
| `LOGIN_RATE_LIMIT` | `5` | Max `POST /api/auth/login` attempts per IP before a 429 (in-memory, resets on success) |
| `LOGIN_RATE_WINDOW_MS` | `900000` | Rate-limit window (15 min) |
| `FORM_RATE_LIMIT` / `FORM_RATE_WINDOW_MS` | `5` / `900000` | Per-IP limit for public review + contact submissions |
| `TRUST_PROXY` | `1` in production | Proxy hops to trust for the client IP (Render = 1) so rate limits are per visitor |
| `RESEND_API_KEY` / `RESEND_FROM` | *(unset → falls back to SMTP)* | Resend HTTPS email API for the contact form (production: Render free blocks SMTP ports) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | *(unset, and no Resend key → contact form disabled)* | SMTP server for the contact form (Gmail: `smtp.gmail.com`, `465`) |
| `SMTP_USER` / `SMTP_PASS` | *(unset)* | SMTP login (Gmail: address + App Password) |
| `CONTACT_TO` / `CONTACT_FROM` | `joecelpergis@gmail.com` / `SMTP_USER` | Where contact messages go / sender address |
| `ANTHROPIC_API_KEY` | *(unset → chat shows contact details)* | "Chat with Gio" on the lab (`POST /api/chat`, Claude Haiku 4.5), grounded on `server/knowledge/gio.md` + the live projects and certificates |
| `CHAT_RATE_LIMIT` / `CHAT_RATE_WINDOW_MS` | `20` / `900000` | Per-IP chat messages per window |
| `CHAT_DAILY_LIMIT` | `300` | Chat messages per UTC day across all visitors (a spend ceiling; resets on redeploy) |
| `GIT_PAT` | *(unset → disabled)* | Commits admin edits back to `main` (production on the free tier). Ignored whenever `DB_FILE` is outside the repo (the disk setup) |
| `GIT_CMS_REMOTE` | `github.com/joecel-hub/portfolio` | Repo the CMS snapshots are pushed to |
| `GIT_CMS_BRANCH` | `main` | Branch CMS snapshots are pushed to |
| `PERSIST_DEBOUNCE_MS` | `8000` | Coalescing window for git pushback — quick edits collapse into one snapshot push (and one auto-deploy) |

## CMS data persistence

Production runs on the **Render free tier**: no persistent disk, so the DB stays in the repo checkout (`server/portfolio.db`) and every admin edit is **committed back to `main`** by `server/pushback.js` (set `GIT_PAT`), which triggers a redeploy with the new data. Outbound SMTP is blocked on free, so the contact form uses **Resend** (`RESEND_API_KEY`). The disk setup below still works if the service moves to a paid plan.

- **First boot on an empty disk**: `server/bootstrapData.js` copies the committed snapshot (`server/portfolio.db` + `server/public/uploads/`) onto the disk once, so the site starts with the real CMS content rather than the default seed. After that the disk is the source of truth and the bootstrap is a no-op.
- **Data fixes** ship as one-time migrations in `server/db.js` (`MIGRATIONS`, recorded in the `migrations` table), never as edits to the binary DB.
- **Backups**: download the DB from the Render shell (`/data/portfolio.db`) or add a disk snapshot schedule in Render.

### Legacy: free-tier git pushback

Before the disk, the free tier wiped the filesystem on every redeploy, so the server **pushed data back to the repo** after every write. The code remains for reference and only activates when `GIT_PAT` is set *and* the DB lives inside the checkout:

1. Seed `server/portfolio.db` (and optional `server/public/uploads/`) is committed and checked out on build.
2. `server/pushback.js` debounces ~8 s after any write (`PERSIST_DEBOUNCE_MS`), checkpoints the SQLite WAL, stages `portfolio.db` + uploads, and commits + pushes them to `GIT_CMS_REMOTE` on `GIT_CMS_BRANCH`.
3. That push triggers Render's auto-deploy, which checks out the updated snapshot — so content survives redeploys at zero cost.
4. On shutdown (`SIGTERM`/`SIGINT`) a synchronous best-effort flush is attempted.

Trade-off: every CMS save causes an auto-deploy (~1 min), and two overlapping deploys editing the same time can race (the push retries up to 3×). Raising `PERSIST_DEBOUNCE_MS` coalesces more edits into fewer pushes → fewer redeploys.

## Legal pages

The site ships four stand-alone legal pages served by the backend before the SPA catch-all:

| Route | Page | Location |
|---|---|---|
| `/privacy` | Privacy Policy | `server/public/privacy/index.html` |
| `/terms` | Terms & Conditions | `server/public/terms/index.html` |
| `/cookies` | Cookie Policy | `server/public/cookies/index.html` |
| `/refund` | Refund & Cancellation Policy | `server/public/refund/index.html` |

- Each page is a self-contained static HTML file (no build step) themed to match the portfolio, with a "← Back to portfolio" link to `/`.
- Routers are registered in `server/app.js` **before** the `dist` SPA catch-all.
- The same four pages are mirrored under `public/{privacy,terms,cookies,refund}/` (the Vite public dir), so they are copied into `dist/` and also work on a static-only host (e.g. Vercel) with no Express routing.
- Content (updated: 8 September 2026): individual studio identity **Joecel Jaygee Pergis trading as Stryg.Bytes**; governing law **UAE**; GDPR-aligned privacy sections covering EU visitors; CCPA/CPRA notes; **no tracking cookies or analytics**; trademark attribution line for client names/logos in Terms.
- `public/sitemap.xml` includes the four legal URLs; `public/robots.txt` keeps `/admin`, `/review` and `/uploads` out of search results.

## Tests

`npm test` runs the backend integration suite against an isolated temp SQLite DB + upload dir (pushback is disabled there, so nothing is committed). It covers health, seeded public lists, login + the rate limiter, authed project CRUD, validation, the public-review → approve → testimonial flow, and the consent-required rejection. Run it locally before pushing backend changes.

## Sections

The site boots in **Normal (Gio)** mode; the Stryg.Bytes studio is one click away via the mode switch.

### Normal mode (Gio) — default: professional profile
Single profile page (`#profile`, light theme). Navigation uses the off-canvas menu at every width.
1. **Home** (`#profile`) — name, title (IT Support Engineer), "IT Infrastructure | Web Developer", summary, View My Work / Download CV, LinkedIn / GitHub / Email
2. **About** (`#pf-about`)
3. **What I Do** (`#pf-whatido`) — IT Support, IT Infrastructure, Web Development, Business Systems
4. **Experience** (`#pf-resume`) — career timeline
5. **Skills** (`#pf-skills`) — grouped skills (no progress bars)
6. **Projects** (`#pf-portfolio`) — real projects with Business Systems / Web Development filters
7. **Certifications & Training** (`#pf-certs`) — grouped by certificate `kind` (certification / training / event), managed in admin
8. **Education** (`#pf-education`)
9. **Beyond Work** (`#pf-hobbies`) — hobbies + video showcase (not in the menu; showcase hidden until a clip is enabled)
10. **Contact** (`#pf-contact`)

### Dev mode (Stryg.Bytes) — technical lab
1. **Hero** (`#hero`) — "Welcome to the Studio" split layout with the 3D hero-bot card
2. **About** (`#about`) — "Why Stryg.Bytes" value cards + circuit illustration
3. **Services** (`#skills-dev`) — bento cards
4. **Projects** (`#projects`) — CMS project grid with category filters (empty categories are hidden)
5. **Process** (`#process`) — 5-step pinned timeline
6. **Testimonials** (`#testimonials`) — client-logo marquee + approved testimonials (whole section hidden until one is approved)
7. **Contact** (`#contact`) — form + social links

## Project Structure

```
src/
├── main.js                   # Entry point
├── assets/
│   └── fonts/                # Self-hosted variable woff2 (jetbrainsmono, inter, syne) + OFL.txt
├── styles/
│   ├── fonts.css             # @font-face declarations for the bundled fonts
│   ├── tokens.css            # CSS custom properties (dev + --nm-* normal tokens)
│   ├── base.css              # Reset, body, normal-mode remapping
│   ├── utilities.css         # Wave dividers, mode visibility, noise
│   ├── responsive.css        # Breakpoints
│   └── components/           # Per-section CSS files
├── js/
│   └── modules/
│       ├── loader.js         # Grid loading screen
│       ├── api-content.js    # Loads projects/logos/testimonials/certificates/hobby clips from the API
│       ├── contact-form.js   # Contact form submit -> /api/contact
│       ├── animations.js     # GSAP scroll animations + Process pin
│       ├── navigation.js / mode-toggle.js / profile.js / text-reveal.js / text-morph.js / text-type.js
│       ├── PixelBlast.jsx    # Three.js shader background (Normal)
│       └── mountPixelBlast.jsx
server/
├── index.js                  # Entry point: env load, listen, shutdown flush
├── app.js                    # Express app (exported so tests can mount it)
├── db.js                     # SQLite schema, migrations, seeding
├── auth.js                   # JWT login + requireAuth middleware
├── middleware/
│   ├── upload.js             # multer config (images + PDFs)
│   └── rateLimit.js          # in-memory per-IP rate limiters (login, reviews, contact)
├── routes/
│   ├── projects.js           # Project CRUD + screenshot upload
│   ├── testimonials.js       # Testimonial CRUD
│   ├── logos.js              # Client logo CRUD + image upload
│   ├── certificates.js       # Certificate CRUD + image/PDF upload
│   ├── reviews.js            # Public submit + admin approve/delete
│   ├── hobbyClips.js         # Hobby video showcase CRUD + video/thumbnail upload
│   └── contact.js            # Public contact form -> SMTP email
└── public/
    ├── admin/index.html      # Admin SPA (login + dashboard)
    ├── review/index.html     # Public review submission page (with required consent checkbox)
    ├── privacy/index.html    # Privacy Policy
    ├── terms/index.html      # Terms & Conditions
    ├── cookies/index.html    # Cookie Policy
    ├── refund/index.html     # Refund & Cancellation Policy
    └── uploads/              # User-uploaded files (gitignored)

public/                            # Vite public dir → copied verbatim into dist/
├── privacy/index.html             # Legal page mirror (also served static on Vercel)
├── terms/index.html
├── cookies/index.html
├── refund/index.html
├── sitemap.xml                    # SEO sitemap (includes the 4 legal URLs)
└── robots.txt

tests/
└── server.test.mjs           # Backend integration tests (npm test)
```

## Deployment

The app is designed to run as **one full-stack service** — the Express server builds and serves the `dist/` frontend, the admin panel, and the API on a single origin.

- Source lives in a **private** GitHub repo (`joecel-hub/portfolio`, `main` branch).
- **Render (free)**: `render.yaml` describes the Web Service (free plan, Singapore region). Build = `npm ci --include=dev && npm run build`, start = `npm run server`, health check = `/api/health`. Auto-deploys on push to `main`. Before pushing from a local clone, `git fetch` and rebase onto any "Gio Portfolio Bot" commits (admin edits).
  - Set `ADMIN_PASS` and `JWT_SECRET` as **secrets** in the Render dashboard. On the disk setup (paid plan) also set `DB_FILE=/data/portfolio.db` and `UPLOAD_DIR=/data/uploads`.
  - Set `GIT_PAT` (GitHub fine-grained token, *Contents: read & write* on this repo only) and `RESEND_API_KEY` as secrets. Do **not** set `DB_FILE`/`UPLOAD_DIR` on the free tier (they point at a disk that does not exist and switch pushback off).
- **Local / dev**: `npm run dev:full` (or `npm run server`) — Vite proxies `/api` and `/uploads` to `localhost:5175`.
- `dist/`, `.vercel/`, `server/.env`, `server/*.db-wal` / `*.db-shm`, and the contents of `server/public/uploads/` are git-ignored. `server/portfolio.db` **is** committed (it is the snapshot a fresh disk is bootstrapped from); do not commit `server/.env`. The legal pages under `server/public/` and their mirrors under `public/` are committed so they exist in both the backend and the static build.

## Notes

- Profile (`.section-title`) headings are excluded from the text-reveal system — they render through the profile entrance animation instead.
- Always call `ScrollTrigger.refresh()` after a mode switch so pinned sections recalculate.
