import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { linkRoutes } from "./routes/links.js";
import { redirectRoutes } from "./routes/redirect.js";
import { analyticsRoutes } from "./routes/analytics.js";

const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, { origin: config.WEB_ORIGIN, credentials: true });
await app.register(jwt, { secret: config.JWT_SECRET });

app.get("/health", async () => ({ status: "ok" }));

await app.register(authRoutes);
await app.register(linkRoutes);
await app.register(analyticsRoutes);
await app.register(redirectRoutes);

try {
  await app.listen({ port: config.PORT, host: config.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
