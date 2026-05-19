import type { FastifyReply, FastifyRequest } from "fastify";

type Bucket = {
  tokens: number;
  updatedAt: number;
};

type Limiter = (req: FastifyRequest, reply: FastifyReply) => void | Promise<void>;

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: { capacity: number; refillPerSec: number; keyOn: "ip" | "user" }): Limiter {
  return async (req, reply) => {
    const key =
      opts.keyOn === "user"
        ? `u:${(req.user as { sub?: number } | undefined)?.sub ?? "anon"}`
        : `ip:${req.ip}`;

    const now = Date.now();
    const existing = buckets.get(key);
    const tokens = existing
      ? Math.min(opts.capacity, existing.tokens + ((now - existing.updatedAt) / 1000) * opts.refillPerSec)
      : opts.capacity;

    if (tokens < 1) {
      reply.code(429).send({ error: "rate_limited" });
      return;
    }

    buckets.set(key, { tokens: tokens - 1, updatedAt: now });
  };
}
