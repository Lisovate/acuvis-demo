import type { FastifyInstance } from "fastify";
import { createLinkSchema } from "@acuvis-demo/shared";
import { nanoid } from "nanoid";
import { db, type LinkRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { hasRole, requireWorkspace } from "../authz.js";
import { emitEvent } from "../webhooks/emitter.js";
import type { JwtPayload } from "../auth.js";

function rowToLink(row: LinkRow) {
  return {
    id: row.id,
    slug: row.slug,
    url: row.url,
    clicks: row.clicks,
    workspaceId: row.workspace_id,
    createdBy: row.user_id,
    createdAt: row.created_at,
  };
}

export async function linkRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireWorkspace("member"));

  app.get("/links", async (req) => {
    const rows = db
      .prepare("SELECT * FROM links WHERE workspace_id = ? ORDER BY id DESC")
      .all(req.workspace!.id) as LinkRow[];
    return rows.map(rowToLink);
  });

  app.post("/links", async (req, reply) => {
    const parsed = createLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
    }

    const user = req.user as JwtPayload;
    const workspaceId = req.workspace!.id;
    const slug = parsed.data.slug ?? nanoid(7);

    const clash = db.prepare("SELECT id FROM links WHERE slug = ?").get(slug);
    if (clash) {
      return reply.code(409).send({ error: "slug_taken" });
    }

    const result = db
      .prepare("INSERT INTO links (user_id, workspace_id, slug, url) VALUES (?, ?, ?, ?)")
      .run(user.sub, workspaceId, slug, parsed.data.url);

    const row = db
      .prepare("SELECT * FROM links WHERE id = ?")
      .get(result.lastInsertRowid) as LinkRow;

    void emitEvent(workspaceId, "link.created", {
      id: row.id,
      slug: row.slug,
      url: row.url,
      createdBy: user.email,
    });
    return reply.code(201).send(rowToLink(row));
  });

  // Creators can delete their own links; admins can delete any link.
  app.delete<{ Params: { id: string } }>("/links/:id", async (req, reply) => {
    const user = req.user as JwtPayload;
    const link = db.prepare("SELECT * FROM links WHERE id = ?").get(Number(req.params.id)) as
      | LinkRow
      | undefined;
    if (!link) {
      return reply.code(404).send({ error: "not_found" });
    }

    const canDelete = link.user_id === user.sub || hasRole(req.membership!.role, "admin");
    if (!canDelete) {
      return reply.code(403).send({ error: "forbidden" });
    }

    db.prepare("DELETE FROM links WHERE id = ?").run(link.id);
    void emitEvent(req.workspace!.id, "link.deleted", { id: link.id, slug: link.slug });
    return reply.code(204).send();
  });
}
