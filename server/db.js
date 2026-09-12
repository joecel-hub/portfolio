import Database from 'better-sqlite3'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_FILE = process.env.DB_FILE || join(__dirname, 'portfolio.db')

export const db = new Database(DB_FILE)
db.pragma('journal_mode = WAL')

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      desc TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      url TEXT NOT NULL DEFAULT '',
      demo_url TEXT NOT NULL DEFAULT '',
      thumb TEXT NOT NULL DEFAULT 'wave',
      category TEXT NOT NULL DEFAULT 'client',
      image TEXT NOT NULL DEFAULT '',
      sort INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      quote TEXT NOT NULL,
      stars INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS client_logos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT NOT NULL DEFAULT '',
      sort INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      quote TEXT NOT NULL,
      stars INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'pending',
      consent INTEGER NOT NULL DEFAULT 0,
      consent_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL DEFAULT '',
      cert_date TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      pdf TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      sort INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS hobby_clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL DEFAULT 'gaming',
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      video_url TEXT NOT NULL DEFAULT '',
      thumbnail TEXT NOT NULL DEFAULT '',
      sort INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  migrateSchema()
}

function migrateSchema() {
  try {
    db.exec(`ALTER TABLE client_logos ADD COLUMN image TEXT NOT NULL DEFAULT ''`)
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN category TEXT NOT NULL DEFAULT 'client'`)
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN demo_url TEXT NOT NULL DEFAULT ''`)
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN image TEXT NOT NULL DEFAULT ''`)
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE reviews ADD COLUMN consent INTEGER NOT NULL DEFAULT 0`)
  } catch {
    // column already exists
  }
  try {
    db.exec(`ALTER TABLE reviews ADD COLUMN consent_at TEXT NOT NULL DEFAULT ''`)
  } catch {
    // column already exists
  }
  backfillCategories()
}

function backfillCategories() {
  const updates = [
    ["SELECT id FROM projects WHERE thumb = 'ai'", 'apps'],
    ["SELECT id FROM projects WHERE thumb = 'motion'", 'apps'],
  ]
  for (const [sql, category] of updates) {
    const rows = db.prepare(sql).all()
    for (const r of rows) {
      db.prepare("UPDATE projects SET category = ? WHERE id = ? AND category = 'client'")
        .run(category, r.id)
    }
  }
}

function count(table) {
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get()
  return row.c
}

export function seedIfEmpty() {
  initSchema()

  const now = Date.now()
  const MTOKEN = hash(now.toString())

  if (count('projects') === 0) {
    const ins = db.prepare(
      'INSERT INTO projects (name, desc, tags, url, thumb, sort) VALUES (?, ?, ?, ?, ?, ?)',
    )
    const seedProjects = [
      {
        name: "Tanken's Mountain Resort",
        desc:
          'Resort website for Dinalungan, Aurora — services, events, gallery, cottage pricing and a reservation flow.',
        tags: ['HTML/CSS', 'JS', 'Booking'],
        url: 'https://tankenresort.com/',
        thumb: 'resort',
        sort: 1,
      },
      {
        name: 'Al Ghurair Contracting & Engineering Works (AGCEW)',
        desc:
          'Corporate site for a UAE construction & engineering contractor — company profile, project portfolio, news, careers and contact.',
        tags: ['Corporate', 'CMS', 'Portfolio'],
        url: 'https://agcew.com/',
        thumb: 'corporate',
        sort: 2,
      },
      {
        name: 'AI-Powered Assistant Build',
        desc:
          'LLM-powered tooling and AI workflows from the Be10X AI & ChatGPT track — prototyping assistants and automation for real tasks.',
        tags: ['AI', 'LLM', 'Web App'],
        url: '',
        thumb: 'ai',
        sort: 3,
      },
      {
        name: 'Interactive Motion Experiment',
        desc:
          'A craft demo exploring scroll-driven narratives, animated SVG, and micro-interaction details — a sandbox for ideas that feed client builds.',
        tags: ['GSAP', 'SVG', 'Motion'],
        url: '',
        thumb: 'motion',
        sort: 4,
      },
    ]
    const tx = db.transaction((rows) => {
      for (const p of rows)
        ins.run(p.name, p.desc, JSON.stringify(p.tags), p.url, p.thumb, p.sort)
    })
    tx(seedProjects)
    backfillCategories()
  }

  if (count('client_logos') === 0) {
    const ins = db.prepare(
      'INSERT INTO client_logos (name, sort, enabled) VALUES (?, ?, 1)',
    )
    const logos = [
      "Tanken's Resort",
      'AGCEW',
      'Al Ghurair',
      'Be10X',
      'GBS Dubai',
      'GSDC',
      'Stryg.Bytes',
    ]
    const tx = db.transaction((rows) => {
      rows.forEach((name, i) => ins.run(name, i))
    })
    tx(logos)
  }

  if (count('reviews') === 0) {
    db.prepare(
      'INSERT INTO reviews (project, name, role, quote, stars, status) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      'AGCEW',
      'Sample Client',
      'Client · Company',
      'Placeholder — replace with a real client review via the admin panel.',
      5,
      'pending',
    )
  }

  if (count('certificates') === 0) {
    const ins = db.prepare(
      `INSERT INTO certificates (name, issuer, cert_date, link, sort, enabled) VALUES (?, ?, ?, ?, ?, 1)`,
    )
    const certs = [
      { name: 'AI Tools & ChatGPT Workshop', issuer: 'Be10X', date: 'July 2026', link: '', sort: 1 },
      { name: 'Cybersecurity: Fastest Growing Careers 2026', issuer: 'GBS Dubai', date: 'July 2026', link: '', sort: 2 },
      { name: 'Intelligent Governance: AI & GRC', issuer: 'GSDC', date: 'July 2026', link: '', sort: 3 },
      {
        name: 'ISO/IEC 27001 Cybersecurity Masterclass',
        issuer: 'GSDC',
        date: 'August 2026',
        link: 'https://www.gsdcouncil.org/share-certificate?cnid=6a830524255df609b5331fe3&ctid=ISO-27001-Cybersecurity-Masterclass-Participant-Certificate-14th-Aug-2026&templateId=ISO-27001-Cybersecurity-Masterclass-Participant-Certificate-14th-Aug-2026',
        sort: 4,
      },
    ]
    const tx = db.transaction((rows) => {
      for (const c of rows) ins.run(c.name, c.issuer, c.date, c.link, c.sort)
    })
    tx(certs)
  }

  if (count('hobby_clips') === 0) {
    const ins = db.prepare(
      `INSERT INTO hobby_clips (category, title, description, video_url, sort, enabled) VALUES (?, ?, ?, '', ?, 0)`,
    )
    const clips = [
      { category: 'gaming', title: 'Add your gaming clip', description: 'Paste a YouTube/Vimeo link or upload a short clip, then enable it here.', sort: 1 },
      { category: 'editing', title: 'Add your edited reel', description: 'Paste a YouTube/Vimeo link or upload a short clip, then enable it here.', sort: 2 },
      { category: 'modeling', title: 'Add your 3D showcase', description: 'A turntable render or WebGL demo clip works well here.', sort: 3 },
      { category: 'music', title: 'Add your music/dance clip', description: 'Paste a YouTube/Vimeo link or upload a short clip, then enable it here.', sort: 4 },
      { category: 'choreography', title: 'Add your choreography clip', description: 'Paste a YouTube/Vimeo link or upload a short clip, then enable it here.', sort: 5 },
    ]
    const tx = db.transaction((rows) => {
      for (const c of rows) ins.run(c.category, c.title, c.description, c.sort)
    })
    tx(clips)
  }

  return MTOKEN
}

function hash(str) {
  return createHash('sha256').update(str).digest('hex').slice(0, 12)
}
