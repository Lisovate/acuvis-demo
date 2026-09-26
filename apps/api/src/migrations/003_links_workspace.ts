import type { Database } from "better-sqlite3";

// Links move from belonging to a user to belonging to a workspace. Existing
// links go to their creator's personal workspace.
export function up(db: Database) {
  db.exec(`
    ALTER TABLE links ADD COLUMN workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE;

    UPDATE links
       SET workspace_id = (SELECT id FROM workspaces WHERE personal_for = links.user_id);

    CREATE INDEX IF NOT EXISTS idx_links_workspace ON links(workspace_id);
  `);
}
