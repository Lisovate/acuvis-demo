import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string().min(16).default("dev-secret-please-override-in-prod"),
  DATABASE_PATH: z.string().default("./data/app.sqlite"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  // Where invite emails send people to accept.
  PUBLIC_WEB_URL: z.string().url().default("http://localhost:5173"),
  WEBHOOK_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  WEBHOOK_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  INVITE_TTL_DAYS: z.coerce.number().int().positive().default(7),
});

export const config = schema.parse(process.env);
export type Config = typeof config;
