import type { Database } from "better-sqlite3";

// Workspaces, memberships, invites and webhooks. Every existing user gets a
// personal workspace so the links backfill in 003 has somewhere to go.
export function up(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      personal_for INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memberships (
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (workspace_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      invited_by INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      events TEXT NOT NULL,
      description TEXT,
      secret TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
      event TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      response_status INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_webhooks_workspace ON webhooks(workspace_id);
  `);

  const users = db.prepare("SELECT id, email FROM users").all() as Array<{ id: number; email: string }>;
  const createWorkspace = db.prepare("INSERT INTO workspaces (name, personal_for) VALUES (?, ?)");
  const addOwner = db.prepare(
    "INSERT INTO memberships (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
  );
  for (const user of users) {
    const result = createWorkspace.run(`${user.email.split("@")[0]}'s links`, user.id);
    addOwner.run(result.lastInsertRowid, user.id);
  }
}
