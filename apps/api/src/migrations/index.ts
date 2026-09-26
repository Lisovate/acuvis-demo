import type { Database } from "better-sqlite3";
import * as initial from "./001_initial.js";
import * as workspaces from "./002_workspaces.js";
import * as linksWorkspace from "./003_links_workspace.js";

type Migration = { name: string; up: (db: Database) => void };

const migrations: Migration[] = [
  { name: "001_initial", up: initial.up },
  { name: "002_workspaces", up: workspaces.up },
  { name: "003_links_workspace", up: linksWorkspace.up },
];

// SQLite's user_version pragma records how far we got; each migration runs in
// its own transaction.
export function migrate(db: Database, log: (msg: string) => void = console.log) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let i = current; i < migrations.length; i++) {
    const migration = migrations[i]!;
    db.transaction(() => {
      migration.up(db);
      db.pragma(`user_version = ${i}`);
    })();
    log(`migrated ${migration.name}`);
  }
}
