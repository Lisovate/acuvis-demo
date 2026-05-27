// Package db owns the *sql.DB handle and the migration step. Sub-packages
// receive *sql.DB via constructor injection rather than calling Open
// directly.
package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

// Open creates the parent directory if missing, opens the SQLite handle,
// and applies the schema. Returns a ready-to-use *sql.DB.
func Open(path string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}
	conn, err := sql.Open("sqlite3", path+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	if err := Migrate(conn); err != nil {
		conn.Close()
		return nil, err
	}
	return conn, nil
}

// Migrate applies the baseline schema. Idempotent — safe to call on a
// fresh or existing DB.
func Migrate(conn *sql.DB) error {
	const schema = `
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    slug            TEXT NOT NULL UNIQUE,
    target_url      TEXT NOT NULL,
    owner_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME,
    password_hash   TEXT
);

CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_owner ON links(owner_id);

CREATE TABLE IF NOT EXISTS clicks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id         INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    occurred_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address      TEXT,
    user_agent      TEXT,
    referer         TEXT
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);

-- Idempotent column adds for upgrades from the v0.1 schema. SQLite
-- doesn't support IF NOT EXISTS on ALTER, so we eat duplicate-column
-- errors below at the Go layer.
`
	if _, err := conn.Exec(schema); err != nil {
		return fmt.Errorf("apply schema: %w", err)
	}
	for _, stmt := range []string{
		`ALTER TABLE links ADD COLUMN expires_at DATETIME`,
		`ALTER TABLE links ADD COLUMN password_hash TEXT`,
	} {
		if _, err := conn.Exec(stmt); err != nil {
			// Existing-column error is benign — anything else is fatal.
			if !isDuplicateColumn(err) {
				return fmt.Errorf("alter links: %w", err)
			}
		}
	}
	return nil
}

func isDuplicateColumn(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	for i := 0; i+len("duplicate column name") <= len(s); i++ {
		if s[i:i+len("duplicate column name")] == "duplicate column name" {
			return true
		}
	}
	return false
}
