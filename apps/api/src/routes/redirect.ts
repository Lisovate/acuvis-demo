import type { FastifyInstance } from "fastify";
import { unlockSchema } from "@acuvis-demo/shared";
import { db, type LinkRow } from "../db.js";
import { recordClick, isExpired } from "../lib/clicks.js";
import { verifyLinkPassword } from "../lib/passwords.js";

export async function redirectRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>("/:slug", async (req, reply) => {
    const row = db.prepare("SELECT * FROM links WHERE slug = ?").get(req.params.slug) as
      | LinkRow
      | undefined;
    if (!row) return reply.code(404).send({ error: "not_found" });

    if (isExpired(row.expires_at)) {
      return reply.code(410).send({ error: "expired" });
    }

    if (row.password_hash) {
      return reply.code(401).send({ error: "password_required", slug: row.slug });
    }

    recordClick({
      linkId: row.id,
      referer: req.headers.referer ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      ip: req.ip,
    });

    return reply.redirect(row.url, 302);
  });

  app.post<{ Params: { slug: string } }>("/:slug/unlock", async (req, reply) => {
    const parsed = unlockSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input" });
    }

    const row = db.prepare("SELECT * FROM links WHERE slug = ?").get(req.params.slug) as
      | LinkRow
      | undefined;
    if (!row || !row.password_hash) {
      return reply.code(404).send({ error: "not_found" });
    }

    if (isExpired(row.expires_at)) {
      return reply.code(410).send({ error: "expired" });
    }

    const ok = await verifyLinkPassword(parsed.data.password, row.password_hash);
    if (!ok) {
      return reply.code(401).send({ error: "invalid_password" });
    }

    recordClick({
      linkId: row.id,
      referer: req.headers.referer ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      ip: req.ip,
    });

    return reply.send({ url: row.url });
  });
}
