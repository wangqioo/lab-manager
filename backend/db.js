const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'lab.db')

let db

function getDb() {
  if (db) return db
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  initSchema()
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      student_id TEXT UNIQUE,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      enrolled_year INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      test_types TEXT NOT NULL DEFAULT '[]',
      sample_description TEXT,
      sample_count INTEGER DEFAULT 1,
      estimated_budget REAL DEFAULT 0,
      actual_cost REAL,
      purpose TEXT,
      notes TEXT DEFAULT '',
      urgency TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      teacher_comment TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      approved_at TEXT
    );
  `)

  // Migration: add approved_by column if not exists
  try { db.exec("ALTER TABLE requests ADD COLUMN approved_by TEXT") } catch {}

  // Migration: remove old default teacher account if it exists
  db.prepare("DELETE FROM users WHERE username = 'teacher' AND id = 'u_teacher'").run()

  // Seed admin account
  const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get()
  if (!adminExists) {
    const hash = bcrypt.hashSync('152535', 10)
    db.prepare(`INSERT INTO users (id, name, username, password_hash, role) VALUES ('u_admin', '管理员', 'admin', ?, 'admin')`).run(hash)
    console.log('Admin account created: admin / 152535')
  }

  // Seed teacher accounts
  const TEACHERS = [
    { id: 'u_czl', name: '陈政霖', username: '陈政霖', password: '13870655072' },
    { id: 'u_ylx', name: '杨丽霞', username: '杨丽霞', password: '15979119610' },
  ]
  for (const t of TEACHERS) {
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(t.username)
    if (!exists) {
      const hash = bcrypt.hashSync(t.password, 10)
      db.prepare(`INSERT INTO users (id, name, username, password_hash, role) VALUES (?, ?, ?, ?, 'teacher')`).run(t.id, t.name, t.username, hash)
      console.log(`Teacher account created: ${t.username}`)
    }
  }
}

module.exports = { getDb }
