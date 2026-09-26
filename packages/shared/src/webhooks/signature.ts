import { createHmac } from "node:crypto";

// Server-only (node:crypto), so it lives at `@acuvis-demo/shared/webhooks`
// rather than the main entry the web app imports. Signature scheme shared by
// the sender (API) and anyone verifying our webhooks in Node: HMAC-SHA256 over "<timestamp>.<raw body>", hex encoded,
// sent as `Acuvis-Signature: t=<timestamp>,v1=<hex>`.

export const SIGNATURE_HEADER = "acuvis-signature";
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export function signPayload(secret: string, body: string, timestamp: number): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

export function parseSignatureHeader(header: string): { timestamp: number; signature: string } | null {
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || !parts.v1) return null;
  return { timestamp, signature: parts.v1 };
}

export function verifySignature(
  secret: string,
  body: string,
  header: string,
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;
  if (Math.abs(now - parsed.timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = signPayload(secret, body, parsed.timestamp).split("v1=")[1];
  return expected === parsed.signature;
}
