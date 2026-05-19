import { z } from "zod";

export const SLUG_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

export const createLinkSchema = z.object({
  url: z.string().url().max(2048),
  slug: z.string().regex(SLUG_REGEX).optional(),
  expiresAt: z.string().datetime().optional(),
  password: z.string().min(4).max(64).optional(),
});

export const linkSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string(),
  url: z.string().url(),
  clicks: z.number().int().nonnegative(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  hasPassword: z.boolean(),
});

export const unlockSchema = z.object({
  password: z.string().min(1).max(64),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type Link = z.infer<typeof linkSchema>;
export type UnlockInput = z.infer<typeof unlockSchema>;
