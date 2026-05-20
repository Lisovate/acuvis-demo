import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config.js";

mkdirSync(dirname(config.DATABASE_PATH), { recursive: true });

export const db = new Database(config.DATABASE_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT,
    password_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id);

  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    referer TEXT,
    user_agent TEXT,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_clicks_link ON clicks(link_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_created ON clicks(created_at);
`);

const linkCols = db.prepare("PRAGMA table_info(links)").all() as { name: string }[];
if (!linkCols.some((c) => c.name === "expires_at")) {
  db.exec("ALTER TABLE links ADD COLUMN expires_at TEXT");
}
if (!linkCols.some((c) => c.name === "password_hash")) {
  db.exec("ALTER TABLE links ADD COLUMN password_hash TEXT");
}

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
};

export type LinkRow = {
  id: number;
  user_id: number;
  slug: string;
  url: string;
  clicks: number;
  expires_at: string | null;
  password_hash: string | null;
  created_at: string;
};

export type ClickRow = {
  id: number;
  link_id: number;
  referer: string | null;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
};
