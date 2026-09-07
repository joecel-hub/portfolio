# Stryg.Bytes CMS — server

Full-stack CMS + admin + client review flow for the portfolio.

## Run

```bash
# 1. (first time) create your config
copy server\.env.example server\.env   # then edit ADMIN_USER / ADMIN_PASS / JWT_SECRET

# 2. start the server (API + admin + review page + serves built portfolio)
npm run server

# default URLs
#   Portfolio  -> http://localhost:5175
#   Admin      -> http://localhost:5175/admin   (login: ADMIN_USER / ADMIN_PASS)
#   Review     -> http://localhost:5175/review?c=ClientName
```

## Dev

```bash
npm run dev     # Vite dev server on 5173; /api is proxied to the server on 5175
npm run server  # start the backend in another terminal
```

## What it does

- **Admin** (`/admin`) — manage projects, client logos, testimonials, and the review inbox.
- **Review flow** — send a client `/review?c=TheirCompany`. Their submission lands in the admin
  **Reviews** tab as *pending*. Approve it → it is copied into the live `Testimonials` table and
  appears on the portfolio's Dev-mode Testimonials section.
- **Portfolio integration** — the site fetches `/api/projects`, `/api/logos`, and
  `/api/testimonials` on load and hydrates the Dev-mode sections. If the API is unreachable,
  the static fallback content in `index.html` is shown instead.

## Data

Stored in `server/portfolio.db` (SQLite) — auto-created and seeded on first boot.

Tables: `projects`, `testimonials`, `client_logos`, `reviews`.

## Deploy

One Node process serves everything: the API, `/admin`, `/review`, and the built portfolio in `dist/`
(`npm run build` first). Host it on any Node-capable service (Railway, Render, a VPS). Set the env
vars from `.env.example`. For a multi-instance/serverless host, swap `better-sqlite3` for Postgres
(recommended before scaling).

## Security

- Single admin account via `.env` (`ADMIN_USER` / `ADMIN_PASS`), password hashed (bcrypt).
- JWT auth on all admin endpoints (expires 7 days).
- Reviews are always `pending` until approved → no public spam.
- Change `JWT_SECRET` before deploying publicly.