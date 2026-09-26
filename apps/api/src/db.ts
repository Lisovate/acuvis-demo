import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config.js";
import { migrate } from "./migrations/index.js";

mkdirSync(dirname(config.DATABASE_PATH), { recursive: true });

export const db = new Database(config.DATABASE_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

migrate(db);

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
};

export type LinkRow = {
  id: number;
  user_id: number;
  workspace_id: number;
  slug: string;
  url: string;
  clicks: number;
  created_at: string;
};

export type WorkspaceRow = {
  id: number;
  name: string;
  personal_for: number | null;
  created_at: string;
};

export type MembershipRow = {
  workspace_id: number;
  user_id: number;
  role: "owner" | "admin" | "member";
  created_at: string;
};

export type InviteRow = {
  id: number;
  workspace_id: number;
  email: string;
  role: "owner" | "admin" | "member";
  token: string;
  invited_by: number;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export type WebhookRow = {
  id: number;
  workspace_id: number;
  url: string;
  events: string;
  description: string | null;
  secret: string;
  active: number;
  created_by: number;
  created_at: string;
};

export type DeliveryRow = {
  id: number;
  webhook_id: number;
  event: string;
  payload: string;
  status: "pending" | "succeeded" | "failed";
  attempts: number;
  response_status: number | null;
  created_at: string;
};
