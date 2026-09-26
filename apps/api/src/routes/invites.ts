import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { acceptInviteSchema, createInviteSchema } from "@acuvis-demo/shared";
import { config } from "../config.js";
import { db, type InviteRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireWorkspace } from "../authz.js";
import { sendInviteEmail } from "../mail.js";
import type { JwtPayload } from "../auth.js";

function rowToInvite(row: InviteRow) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  };
}

export async function inviteRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get<{ Params: { workspaceId: string } }>(
    "/workspaces/:workspaceId/invites",
    { preHandler: requireWorkspace("admin") },
    async (req) => {
      const rows = db
        .prepare(
          "SELECT * FROM invites WHERE workspace_id = ? AND accepted_at IS NULL ORDER BY id DESC",
        )
        .all(req.workspace!.id) as InviteRow[];
      return rows.map(rowToInvite);
    },
  );

  app.post<{ Params: { workspaceId: string } }>(
    "/workspaces/:workspaceId/invites",
    { preHandler: requireWorkspace("admin") },
    async (req, reply) => {
      const parsed = createInviteSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
      }
      const user = req.user as JwtPayload;
      const workspace = req.workspace!;
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + config.INVITE_TTL_DAYS * 86_400_000).toISOString();

      const result = db
        .prepare(
          `INSERT INTO invites (workspace_id, email, role, token, invited_by, expires_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(workspace.id, parsed.data.email, parsed.data.role, token, user.sub, expiresAt);

      await sendInviteEmail(req.log, {
        email: parsed.data.email,
        workspaceName: workspace.name,
        url: `${config.PUBLIC_WEB_URL}/invite?token=${token}`,
      });

      const row = db
        .prepare("SELECT * FROM invites WHERE id = ?")
        .get(result.lastInsertRowid) as InviteRow;
      return reply.code(201).send(rowToInvite(row));
    },
  );

  app.post("/invites/accept", async (req, reply) => {
    const parsed = acceptInviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input" });
    }
    const user = req.user as JwtPayload;
    const invite = db
      .prepare("SELECT * FROM invites WHERE token = ?")
      .get(parsed.data.token) as InviteRow | undefined;
    if (!invite) {
      return reply.code(404).send({ error: "invite_not_found" });
    }

    db.transaction(() => {
      db.prepare(
        "INSERT OR REPLACE INTO memberships (workspace_id, user_id, role) VALUES (?, ?, ?)",
      ).run(invite.workspace_id, user.sub, invite.role);
      db.prepare("UPDATE invites SET accepted_at = datetime('now') WHERE id = ?").run(invite.id);
    })();

    return { workspaceId: invite.workspace_id, role: invite.role };
  });
}
