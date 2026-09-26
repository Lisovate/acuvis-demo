# Webhooks

Workspaces can register HTTPS endpoints that receive a POST whenever a link is
created, clicked or deleted. Owners and admins manage them under **Webhooks**.

## Events

| Event | When | `data` |
|-------|------|--------|
| `link.created` | A link is created in the workspace | `id`, `slug`, `url`, `createdBy` |
| `link.clicked` | Someone follows a short link | `id`, `slug`, `url`, `ip`, `userAgent`, `referer` |
| `link.deleted` | A link is deleted | `id`, `slug` |

## Payload

```json
{
  "id": "5d0f6c1e-7a0b-4f8e-9f5e-2b8f1c0e9a11",
  "event": "link.clicked",
  "workspaceId": 42,
  "createdAt": "2026-09-26T10:14:03.512Z",
  "data": { "id": 7, "slug": "launch", "url": "https://example.com/launch" }
}
```

## Verifying signatures

Every request carries `Acuvis-Signature: t=<unix seconds>,v1=<hex>`, an
HMAC-SHA256 of `<t>.<raw body>` keyed with the webhook's signing secret.
Reject anything older than five minutes.

```ts
import { createHmac } from "node:crypto";

export function isValid(secret: string, rawBody: string, header: string) {
  const { t, v1 } = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return expected === v1;
}
```

Or use `verifySignature` from `@acuvis-demo/shared/webhooks`.

## Retries

A delivery that times out (10 s) or gets a non-2xx response is retried with
exponential backoff (2 s, 4 s, 8 s, …) up to five times. The last 50 deliveries
per webhook are listed in the dashboard.
