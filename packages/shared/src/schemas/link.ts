import { z } from "zod";

export const SLUG_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

export const createLinkSchema = z.object({
  url: z.string().url().max(2048),
  slug: z.string().regex(SLUG_REGEX).optional(),
});

export const linkSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string(),
  url: z.string().url(),
  clicks: z.number().int().nonnegative(),
  workspaceId: z.number().int().positive(),
  createdBy: z.number().int().positive(),
  createdAt: z.string(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type Link = z.infer<typeof linkSchema>;
