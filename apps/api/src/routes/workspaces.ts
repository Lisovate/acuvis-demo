import type { FastifyInstance } from "fastify";
import { createWorkspaceSchema, renameWorkspaceSchema } from "@acuvis-demo/shared";
import { db, type MembershipRow, type WorkspaceRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireWorkspace } from "../authz.js";
import type { JwtPayload } from "../auth.js";

type WorkspaceWithRole = WorkspaceRow & { role: MembershipRow["role"] };

function rowToWorkspace(row: WorkspaceWithRole) {
  return { id: row.id, name: row.name, role: row.role, createdAt: row.created_at };
}

export function createPersonalWorkspace(userId: number, email: string): number {
  return db.transaction(() => {
    const result = db
      .prepare("INSERT INTO workspaces (name, personal_for) VALUES (?, ?)")
      .run(`${email.split("@")[0]}'s links`, userId);
    const workspaceId = Number(result.lastInsertRowid);
    db.prepare("INSERT INTO memberships (workspace_id, user_id, role) VALUES (?, ?, 'owner')").run(
      workspaceId,
      userId,
    );
    return workspaceId;
  })();
}

export async function workspaceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/workspaces", async (req) => {
    const user = req.user as JwtPayload;
    const rows = db
      .prepare(
        `SELECT w.*, m.role FROM workspaces w
           JOIN memberships m ON m.workspace_id = w.id
          WHERE m.user_id = ?
          ORDER BY w.personal_for IS NULL, w.name`,
      )
      .all(user.sub) as WorkspaceWithRole[];
    return rows.map(rowToWorkspace);
  });

  app.post("/workspaces", async (req, reply) => {
    const parsed = createWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
    }
    const user = req.user as JwtPayload;
    const id = db.transaction(() => {
      const result = db.prepare("INSERT INTO workspaces (name) VALUES (?)").run(parsed.data.name);
      const workspaceId = Number(result.lastInsertRowid);
      db.prepare(
        "INSERT INTO memberships (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
      ).run(workspaceId, user.sub);
      return workspaceId;
    })();
    const row = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as WorkspaceRow;
    return reply.code(201).send(rowToWorkspace({ ...row, role: "owner" }));
  });

  app.patch<{ Params: { workspaceId: string } }>(
    "/workspaces/:workspaceId",
    { preHandler: requireWorkspace("admin") },
    async (req, reply) => {
      const parsed = renameWorkspaceSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
      }
      db.prepare("UPDATE workspaces SET name = ? WHERE id = ?").run(parsed.data.name, req.workspace!.id);
      return rowToWorkspace({ ...req.workspace!, name: parsed.data.name, role: req.membership!.role });
    },
  );
}
