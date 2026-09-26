import { z } from "zod";

export const WEBHOOK_EVENTS = ["link.created", "link.clicked", "link.deleted"] as const;
export const webhookEventSchema = z.enum(WEBHOOK_EVENTS);

export const createWebhookSchema = z.object({
  url: z.string().url().max(2048),
  events: z.array(webhookEventSchema).min(1),
  description: z.string().max(200).optional(),
});

export const webhookSchema = z.object({
  id: z.number().int().positive(),
  url: z.string().url(),
  events: z.array(webhookEventSchema),
  description: z.string().nullable(),
  secret: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const deliverySchema = z.object({
  id: z.number().int().positive(),
  event: webhookEventSchema,
  status: z.enum(["pending", "succeeded", "failed"]),
  attempts: z.number().int().nonnegative(),
  responseStatus: z.number().int().nullable(),
  createdAt: z.string(),
});

export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export type WebhookPayload<T = Record<string, unknown>> = {
  id: string;
  event: WebhookEvent;
  workspaceId: number;
  createdAt: string;
  data: T;
};
