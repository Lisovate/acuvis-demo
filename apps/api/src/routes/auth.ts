import type { FastifyInstance } from "fastify";
import { loginSchema, registerSchema } from "@acuvis-demo/shared";
import { db, type UserRow } from "../db.js";
import { hashPassword, verifyPassword } from "../auth.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input", issues: parsed.error.issues });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(parsed.data.email);
    if (existing) {
      return reply.code(409).send({ error: "email_taken" });
    }

    const hash = await hashPassword(parsed.data.password);
    const result = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(parsed.data.email, hash);

    const id = Number(result.lastInsertRowid);
    const token = await reply.jwtSign({ sub: id, email: parsed.data.email });
    return reply.code(201).send({ token, user: { id, email: parsed.data.email } });
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_input" });
    }

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(parsed.data.email) as UserRow | undefined;
    if (!user) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const ok = await verifyPassword(parsed.data.password, user.password_hash);
    if (!ok) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    return reply.send({ token, user: { id: user.id, email: user.email } });
  });
}
