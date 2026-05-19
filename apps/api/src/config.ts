import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string().min(16).default("dev-secret-please-override-in-prod"),
  DATABASE_PATH: z.string().default("./data/app.sqlite"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
});

export const config = schema.parse(process.env);
export type Config = typeof config;
