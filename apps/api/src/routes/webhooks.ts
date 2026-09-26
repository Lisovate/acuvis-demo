import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { createWebhookSchema, type WebhookEvent } from "@acuvis-demo/shared";
import { db, type DeliveryRow, type WebhookRow } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireWorkspace } from "../authz.js";
import { deliver } from "../webhooks/deliver.js";
import type { JwtPayload } from "../auth.js";

function rowToWebhook(row: WebhookRow) {
  return {
    id: row.id,
    url: row.url,
    events: JSON.parse(row.events) as WebhookEvent[],
    description: row.description,
    secret: row.secret,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function rowToDelivery(row: DeliveryRow) {
  return {
    id: row.id,
    event: row.event,
    status: row.status,
    attempts: row.attempts,
    responseStatus: row.response_status,
    createdAt: row.created_at,
  };
}

export async function webhookRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/webhooks", { preHandler: requireWorkspace("member") }, async (req) => {
    const rows = db
      .prepare("SELECT * FROM webhooks WHERE workspace_id = ? ORDER BY id DESC")
      .all(req.workspace!.id) as WebhookRow[];
    return rows.map(rowToWebhook);
  });

  app.post("/webhooks", { preHandler: requireWorkspace("admin") }, async (req, reply) => {
    const parsed = createWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
    }
    const user = req.user as JwtPayload;
    const result = db
      .prepare(
        `INSERT INTO webhooks (workspace_id, url, events, description, secret, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.workspace!.id,
        parsed.data.url,
        JSON.stringify(parsed.data.events),
        parsed.data.description ?? null,
        `whsec_${nanoid(32)}`,
        user.sub,
      );
    const row = db.prepare("SELECT * FROM webhooks WHERE id = ?").get(result.lastInsertRowid) as WebhookRow;
    return reply.code(201).send(rowToWebhook(row));
  });

  app.delete<{ Params: { id: string } }>(
    "/webhooks/:id",
    { preHandler: requireWorkspace("admin") },
    async (req, reply) => {
      const result = db
        .prepare("DELETE FROM webhooks WHERE id = ? AND workspace_id = ?")
        .run(Number(req.params.id), req.workspace!.id);
      if (result.changes === 0) {
        return reply.code(404).send({ error: "webhook_not_found" });
      }
      return reply.code(204).send();
    },
  );

  app.get<{ Params: { id: string } }>(
    "/webhooks/:id/deliveries",
    { preHandler: requireWorkspace("member") },
    async (req, reply) => {
      const hook = db
        .prepare("SELECT * FROM webhooks WHERE id = ? AND workspace_id = ?")
        .get(Number(req.params.id), req.workspace!.id) as WebhookRow | undefined;
      if (!hook) {
        return reply.code(404).send({ error: "webhook_not_found" });
      }
      const rows = db
        .prepare("SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY id DESC LIMIT 50")
        .all(hook.id) as DeliveryRow[];
      return rows.map(rowToDelivery);
    },
  );

  // Sends a `link.created` sample so people can check their endpoint.
  app.post<{ Params: { id: string } }>(
    "/webhooks/:id/test",
    { preHandler: requireWorkspace("admin") },
    async (req, reply) => {
      const hook = db
        .prepare("SELECT * FROM webhooks WHERE id = ? AND workspace_id = ?")
        .get(Number(req.params.id), req.workspace!.id) as WebhookRow | undefined;
      if (!hook) {
        return reply.code(404).send({ error: "webhook_not_found" });
      }
      await deliver(hook, {
        id: `test_${nanoid(12)}`,
        event: "link.created",
        workspaceId: hook.workspace_id,
        createdAt: new Date().toISOString(),
        data: { slug: "example", url: "https://example.com", test: true },
      });
      return reply.code(202).send({ queued: true });
    },
  );
}
