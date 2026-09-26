import type { WebhookPayload } from "@acuvis-demo/shared";
import { signPayload } from "@acuvis-demo/shared/webhooks";
import { config } from "../config.js";
import { db, type WebhookRow } from "../db.js";

const USER_AGENT = "acuvis-demo-webhooks/1.0";

export type DeliveryResult = { ok: boolean; status: number | null };

async function post(hook: WebhookRow, body: string): Promise<DeliveryResult> {
  const timestamp = Math.floor(Date.now() / 1000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(hook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": USER_AGENT,
        "acuvis-signature": signPayload(hook.secret, body, timestamp),
      },
      body,
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: null };
  } finally {
    clearTimeout(timer);
  }
}

// Delivers one payload to one webhook, recording every attempt. Failures are
// retried with exponential backoff: 2s, 4s, 8s, ...
export async function deliver(
  hook: WebhookRow,
  payload: WebhookPayload,
  deliveryId?: number,
  attempt = 1,
): Promise<void> {
  const body = JSON.stringify(payload);
  const id =
    deliveryId ??
    Number(
      db
        .prepare("INSERT INTO webhook_deliveries (webhook_id, event, payload) VALUES (?, ?, ?)")
        .run(hook.id, payload.event, body).lastInsertRowid,
    );

  const result = await post(hook, body);
  db.prepare(
    "UPDATE webhook_deliveries SET attempts = ?, response_status = ?, status = ? WHERE id = ?",
  ).run(attempt, result.status, result.ok ? "succeeded" : "pending", id);

  if (result.ok) return;

  if (attempt <= config.WEBHOOK_MAX_ATTEMPTS) {
    const delay = 2 ** attempt * 1000;
    setTimeout(() => void deliver(hook, payload, id, attempt + 1), delay);
  } else {
    db.prepare("UPDATE webhook_deliveries SET status = 'failed' WHERE id = ?").run(id);
  }
}
