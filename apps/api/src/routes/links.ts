import type { FastifyInstance } from "fastify";
import { createLinkSchema } from "@acuvis-demo/shared";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db, type LinkRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import type { JwtPayload } from "../auth.js";

// Dashboard pages through links newest-first. The total goes in a header so
// the response body stays an array and existing clients keep working.
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

function rowToLink(row: LinkRow) {
  return {
    id: row.id,
    slug: row.slug,
    url: row.url,
    clicks: row.clicks,
    createdAt: row.created_at,
  };
}

export async function linkRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/links", async (req, reply) => {
    const query = listQuerySchema.safeParse(req.query);
    if (!query.success) {
      return reply.code(400).send({ error: "invalid_query", issues: query.error.issues });
    }
    const { limit, offset } = query.data;
    const user = req.user as JwtPayload;
    const rows = db
      .prepare("SELECT * FROM links WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?")
      .all(user.sub, limit, offset) as LinkRow[];
    const { total } = db
      .prepare("SELECT COUNT(*) AS total FROM links WHERE user_id = ?")
      .get(user.sub) as { total: number };
    reply.header("X-Total-Count", String(total));
    return rows.map(rowToLink);
  });

  app.post("/links", async (req, reply) => {
    const parsed = createLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
    }

    const user = req.user as JwtPayload;
    const slug = parsed.data.slug ?? nanoid(7);

    const clash = db.prepare("SELECT id FROM links WHERE slug = ?").get(slug);
    if (clash) {
      return reply.code(409).send({ error: "slug_taken" });
    }

    const result = db
      .prepare("INSERT INTO links (user_id, slug, url) VALUES (?, ?, ?)")
      .run(user.sub, slug, parsed.data.url);

    const row = db
      .prepare("SELECT * FROM links WHERE id = ?")
      .get(result.lastInsertRowid) as LinkRow;
    return reply.code(201).send(rowToLink(row));
  });
}
