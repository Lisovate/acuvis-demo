import { z } from "zod";

export const dailyClickSchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
});

export const refererCountSchema = z.object({
  referer: z.string().nullable(),
  count: z.number().int().nonnegative(),
});

export const clickSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  daily: z.array(dailyClickSchema),
  topReferers: z.array(refererCountSchema),
});

export type DailyClick = z.infer<typeof dailyClickSchema>;
export type RefererCount = z.infer<typeof refererCountSchema>;
export type ClickSummary = z.infer<typeof clickSummarySchema>;
