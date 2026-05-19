import type { FastifyInstance } from "fastify";
import { createLinkSchema } from "@acuvis-demo/shared";
import { nanoid } from "nanoid";
import { db, type LinkRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import type { JwtPayload } from "../auth.js";

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

  app.get("/links", async (req) => {
    const user = req.user as JwtPayload;
    const rows = db
      .prepare("SELECT * FROM links WHERE user_id = ? ORDER BY id DESC")
      .all(user.sub) as LinkRow[];
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
