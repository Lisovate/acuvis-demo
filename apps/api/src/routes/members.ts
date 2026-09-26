import type { FastifyInstance } from "fastify";
import { updateMemberSchema } from "@acuvis-demo/shared";
import { db, type MembershipRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getMembership, requireWorkspace } from "../authz.js";
import type { JwtPayload } from "../auth.js";

type MemberParams = { workspaceId: string; userId: string };

function ownerCount(workspaceId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM memberships WHERE workspace_id = ? AND role = 'owner'")
    .get(workspaceId) as { n: number };
  return row.n;
}

export async function memberRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get<{ Params: { workspaceId: string } }>(
    "/workspaces/:workspaceId/members",
    { preHandler: requireWorkspace("member") },
    async (req) => {
      const memberships = db
        .prepare("SELECT * FROM memberships WHERE workspace_id = ? ORDER BY created_at")
        .all(req.workspace!.id) as MembershipRow[];

      return memberships.map((m) => {
        const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(m.user_id) as {
          id: number;
          email: string;
        };
        return { userId: user.id, email: user.email, role: m.role, joinedAt: m.created_at };
      });
    },
  );

  app.patch<{ Params: MemberParams }>(
    "/workspaces/:workspaceId/members/:userId",
    { preHandler: requireWorkspace("admin") },
    async (req, reply) => {
      const parsed = updateMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
      }
      const workspaceId = req.workspace!.id;
      const target = getMembership(workspaceId, Number(req.params.userId));
      if (!target) {
        return reply.code(404).send({ error: "member_not_found" });
      }

      // A workspace always keeps at least one owner.
      if (target.role === "owner" && parsed.data.role !== "owner" && ownerCount(workspaceId) <= 1) {
        return reply.code(409).send({ error: "last_owner" });
      }

      db.prepare("UPDATE memberships SET role = ? WHERE workspace_id = ? AND user_id = ?").run(
        parsed.data.role,
        workspaceId,
        target.user_id,
      );
      return { userId: target.user_id, role: parsed.data.role };
    },
  );

  app.delete<{ Params: MemberParams }>(
    "/workspaces/:workspaceId/members/:userId",
    { preHandler: requireWorkspace("member") },
    async (req, reply) => {
      const user = req.user as JwtPayload;
      const userId = Number(req.params.userId);
      const leaving = userId === user.sub;

      // Members can leave; removing someone else takes an admin.
      if (!leaving && req.membership!.role === "member") {
        return reply.code(403).send({ error: "forbidden" });
      }

      const result = db
        .prepare("DELETE FROM memberships WHERE workspace_id = ? AND user_id = ?")
        .run(req.workspace!.id, userId);
      if (result.changes === 0) {
        return reply.code(404).send({ error: "member_not_found" });
      }
      return reply.code(204).send();
    },
  );
}
