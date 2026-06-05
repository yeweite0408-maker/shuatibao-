import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '..', 'quiz.db')

let db = null
let inTransaction = false

export async function initDB() {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT,
      answer TEXT NOT NULL,
      explanation TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      is_bookmarked INTEGER DEFAULT 0,
      session_id TEXT NOT NULL,
      user_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 兼容旧表
  try { db.run('ALTER TABLE questions ADD COLUMN subject TEXT DEFAULT \'\'') } catch {}
  try { db.run('ALTER TABLE questions ADD COLUMN status TEXT DEFAULT \'approved\'') } catch {}
  try { db.run('ALTER TABLE questions ADD COLUMN uploaded_by INTEGER DEFAULT NULL') } catch {}
  try { db.run("ALTER TABLE questions ADD COLUMN scope TEXT DEFAULT 'public'") } catch {}
  try { db.run('ALTER TABLE records ADD COLUMN user_id INTEGER DEFAULT NULL') } catch {}
  try { db.run('ALTER TABLE users ADD COLUMN role TEXT DEFAULT \'user\'') } catch {}

  // 纠正表
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_id INTEGER DEFAULT NULL,
      username TEXT DEFAULT '',
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reply TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 反馈表
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT NULL,
      username TEXT DEFAULT '',
      content TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      reply TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  save()
  return db
}

export function save() {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

export function all(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function get(sql, params = []) {
  const rows = all(sql, params)
  return rows.length > 0 ? rows[0] : null
}

export function run(sql, params = []) {
  db.run(sql, params)
  const changes = db.getRowsModified()
  const lastIdResult = db.exec('SELECT last_insert_rowid()')
  const lastInsertRowid = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : null
  if (!inTransaction) save()
  return { lastInsertRowid, changes }
}

export function transaction(fn) {
  return function (...args) {
    db.run('BEGIN TRANSACTION')
    inTransaction = true
    try {
      fn(...args)
      db.run('COMMIT')
      save()
    } catch (e) {
      try { db.run('ROLLBACK') } catch {}
      throw e
    } finally {
      inTransaction = false
    }
  }
}
