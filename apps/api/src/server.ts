import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { linkRoutes } from "./routes/links.js";
import { redirectRoutes } from "./routes/redirect.js";
import { workspaceRoutes } from "./routes/workspaces.js";
import { memberRoutes } from "./routes/members.js";
import { inviteRoutes } from "./routes/invites.js";
import { webhookRoutes } from "./routes/webhooks.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: config.WEB_ORIGIN,
  credentials: true,
  allowedHeaders: ["content-type", "authorization", "x-workspace-id"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
});
await app.register(jwt, { secret: config.JWT_SECRET });

app.get("/health", async () => ({ status: "ok" }));

await app.register(authRoutes);
await app.register(workspaceRoutes);
await app.register(memberRoutes);
await app.register(inviteRoutes);
await app.register(linkRoutes);
await app.register(webhookRoutes);
await app.register(redirectRoutes);

try {
  await app.listen({ port: config.PORT, host: config.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
