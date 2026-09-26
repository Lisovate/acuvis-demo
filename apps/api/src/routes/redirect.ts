import type { FastifyInstance } from "fastify";
import { db, type LinkRow } from "../db.js";
import { emitEvent } from "../webhooks/emitter.js";

export async function redirectRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>("/:slug", async (req, reply) => {
    const { slug } = req.params;
    const row = db.prepare("SELECT * FROM links WHERE slug = ?").get(slug) as
      | LinkRow
      | undefined;
    if (!row) {
      return reply.code(404).send({ error: "not_found" });
    }

    db.prepare("UPDATE links SET clicks = clicks + 1 WHERE id = ?").run(row.id);

    await emitEvent(row.workspace_id, "link.clicked", {
      id: row.id,
      slug: row.slug,
      url: row.url,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? null,
      referer: req.headers.referer ?? null,
    });

    return reply.redirect(row.url, 302);
  });
}
