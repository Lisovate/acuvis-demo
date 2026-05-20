import { db } from "../db.js";

export type ClickContext = {
  linkId: number;
  referer: string | null;
  userAgent: string | null;
  ip: string | null;
};

const insertClick = db.prepare(
  "INSERT INTO clicks (link_id, referer, user_agent, ip) VALUES (?, ?, ?, ?)",
);
const bumpCounter = db.prepare("UPDATE links SET clicks = clicks + 1 WHERE id = ?");

export function recordClick(ctx: ClickContext): void {
  insertClick.run(ctx.linkId, ctx.referer, ctx.userAgent, ctx.ip);
  bumpCounter.run(ctx.linkId);
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return Date.parse(expiresAt) <= Date.now();
}
