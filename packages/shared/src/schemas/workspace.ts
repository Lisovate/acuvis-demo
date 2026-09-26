import { z } from "zod";

export const WORKSPACE_ROLES = ["owner", "admin", "member"] as const;
export const workspaceRoleSchema = z.enum(WORKSPACE_ROLES);

export const workspaceSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  role: workspaceRoleSchema,
  createdAt: z.string(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(64),
});

export const renameWorkspaceSchema = createWorkspaceSchema;

export const memberSchema = z.object({
  userId: z.number().int().positive(),
  email: z.string().email(),
  role: workspaceRoleSchema,
  joinedAt: z.string(),
});

export const updateMemberSchema = z.object({
  role: workspaceRoleSchema,
});

export const createInviteSchema = z.object({
  email: z.string().email().max(254),
  role: workspaceRoleSchema.default("member"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(16).max(128),
});

export const inviteSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  role: workspaceRoleSchema,
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
});

export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Invite = z.infer<typeof inviteSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
