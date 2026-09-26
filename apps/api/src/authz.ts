import type { FastifyReply, FastifyRequest } from "fastify";
import type { WorkspaceRole } from "@acuvis-demo/shared";
import { db, type MembershipRow, type WorkspaceRow } from "./db.js";
import type { JwtPayload } from "./auth.js";

export const ROLE_RANK: Record<WorkspaceRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function hasRole(role: WorkspaceRole, atLeast: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[atLeast];
}

export function getMembership(workspaceId: number, userId: number): MembershipRow | undefined {
  return db
    .prepare("SELECT * FROM memberships WHERE workspace_id = ? AND user_id = ?")
    .get(workspaceId, userId) as MembershipRow | undefined;
}

declare module "fastify" {
  interface FastifyRequest {
    workspace?: WorkspaceRow;
    membership?: MembershipRow;
  }
}

// Resolves the active workspace from the `X-Workspace-Id` header (or the
// `:workspaceId` route param) and checks the caller's role in it. Runs after
// requireAuth.
export function requireWorkspace(atLeast: WorkspaceRole = "member") {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user as JwtPayload;
    const params = req.params as { workspaceId?: string } | undefined;
    const raw = params?.workspaceId ?? req.headers["x-workspace-id"];
    const workspaceId = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
      return reply.code(400).send({ error: "workspace_required" });
    }

    const membership = getMembership(workspaceId, user.sub);
    if (!membership) {
      return reply.code(404).send({ error: "workspace_not_found" });
    }
    if (!hasRole(membership.role, atLeast)) {
      return reply.code(403).send({ error: "forbidden" });
    }

    req.membership = membership;
    req.workspace = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(workspaceId) as WorkspaceRow;
  };
}
