import type { FastifyInstance } from "fastify";
import type { ClickSummary } from "@acuvis-demo/shared";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import type { JwtPayload } from "../auth.js";

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get<{ Params: { id: string } }>("/links/:id/clicks", async (req, reply) => {
    const user = req.user as JwtPayload;
    const link = db
      .prepare("SELECT id FROM links WHERE id = ? AND user_id = ?")
      .get(req.params.id, user.sub);
    if (!link) return reply.code(404).send({ error: "not_found" });

    const total = (db
      .prepare("SELECT COUNT(*) AS n FROM clicks WHERE link_id = ?")
      .get(req.params.id) as { n: number }).n;

    const daily = db
      .prepare(
        `SELECT date(created_at) AS date, COUNT(*) AS count
         FROM clicks
         WHERE link_id = ? AND created_at >= datetime('now', '-30 days')
         GROUP BY date(created_at)
         ORDER BY date(created_at)`,
      )
      .all(req.params.id) as { date: string; count: number }[];

    const topReferers = db
      .prepare(
        `SELECT referer, COUNT(*) AS count
         FROM clicks
         WHERE link_id = ?
         GROUP BY referer
         ORDER BY count DESC
         LIMIT 5`,
      )
      .all(req.params.id) as { referer: string | null; count: number }[];

    const summary: ClickSummary = { total, daily, topReferers };
    return summary;
  });
}
