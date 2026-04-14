import Database from 'better-sqlite3'
import { config } from '../config'

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS records (
    id            TEXT PRIMARY KEY,
    resource_type TEXT NOT NULL,
    subject       TEXT,
    extracted     TEXT NOT NULL,
    raw           TEXT NOT NULL,
    imported_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS import_sessions (
    id          TEXT PRIMARY KEY,
    total       INTEGER NOT NULL,
    imported    INTEGER NOT NULL,
    errors      TEXT NOT NULL,
    warnings    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`

const createDb = (): Database.Database => {
  const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : config.db.path
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  return db
}

export const db = createDb()