import type { FastifyInstance } from "fastify";
import { createLinkSchema } from "@acuvis-demo/shared";
import { nanoid } from "nanoid";
import { db, type LinkRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { hashLinkPassword } from "../lib/passwords.js";
import type { JwtPayload } from "../auth.js";

function rowToLink(row: LinkRow) {
  return {
    id: row.id,
    slug: row.slug,
    url: row.url,
    clicks: row.clicks,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    hasPassword: row.password_hash !== null,
  };
}

const createLimiter = rateLimit({ capacity: 10, refillPerSec: 0.1, keyOn: "user" });

export async function linkRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/links", async (req) => {
    const user = req.user as JwtPayload;
    const rows = db
      .prepare("SELECT * FROM links WHERE user_id = ? ORDER BY id DESC")
      .all(user.sub) as LinkRow[];
    return rows.map(rowToLink);
  });

  app.get<{ Params: { id: string } }>("/links/:id", async (req, reply) => {
    const user = req.user as JwtPayload;
    const row = db
      .prepare("SELECT * FROM links WHERE id = ? AND user_id = ?")
      .get(req.params.id, user.sub) as LinkRow | undefined;
    if (!row) return reply.code(404).send({ error: "not_found" });
    return rowToLink(row);
  });

  app.post("/links", { preHandler: createLimiter }, async (req, reply) => {
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

    const passwordHash = parsed.data.password ? await hashLinkPassword(parsed.data.password) : null;

    const result = db
      .prepare(
        "INSERT INTO links (user_id, slug, url, expires_at, password_hash) VALUES (?, ?, ?, ?, ?)",
      )
      .run(user.sub, slug, parsed.data.url, parsed.data.expiresAt ?? null, passwordHash);

    const row = db
      .prepare("SELECT * FROM links WHERE id = ?")
      .get(result.lastInsertRowid) as LinkRow;
    return reply.code(201).send(rowToLink(row));
  });

  app.delete<{ Params: { id: string } }>("/links/:id", async (req, reply) => {
    const user = req.user as JwtPayload;
    const result = db
      .prepare("DELETE FROM links WHERE id = ? AND user_id = ?")
      .run(req.params.id, user.sub);
    if (result.changes === 0) {
      return reply.code(404).send({ error: "not_found" });
    }
    return reply.code(204).send();
  });
}
