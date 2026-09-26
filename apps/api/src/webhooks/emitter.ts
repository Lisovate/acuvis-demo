import { randomUUID } from "node:crypto";
import type { WebhookEvent, WebhookPayload } from "@acuvis-demo/shared";
import { db, type WebhookRow } from "../db.js";
import { deliver } from "./deliver.js";

// Sends an event to every active webhook in the workspace that subscribed to
// it. Each webhook gets its own delivery record.
export async function emitEvent(
  workspaceId: number,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const hooks = db
    .prepare("SELECT * FROM webhooks WHERE workspace_id = ? AND active = 1")
    .all(workspaceId) as WebhookRow[];

  const payload: WebhookPayload = {
    id: randomUUID(),
    event,
    workspaceId,
    createdAt: new Date().toISOString(),
    data,
  };

  for (const hook of hooks) {
    const events = JSON.parse(hook.events) as WebhookEvent[];
    if (!events.includes(event)) continue;
    await deliver(hook, payload);
  }
}
