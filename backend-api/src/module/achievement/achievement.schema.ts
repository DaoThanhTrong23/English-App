import { z } from "zod";

export const CreateAchievementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Tiêu đề không được trống").max(100),
    description: z.string().trim().nullish(),
    iconUrl: z.string().trim().nullish(),
    requireXp: z.coerce.number().int().min(0).default(0),
    requireStreak: z.coerce.number().int().min(0).default(0),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const UpdateAchievementSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    title: z.string().trim().min(1, "Tiêu đề không được trống").max(100).optional(),
    description: z.string().trim().nullish(),
    iconUrl: z.string().trim().nullish(),
    requireXp: z.coerce.number().int().min(0).optional(),
    requireStreak: z.coerce.number().int().min(0).optional(),
  }),
  query: z.object({}),
});

export const AchievementIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export type CreateAchievementInput = z.infer<typeof CreateAchievementSchema>["body"];
export type UpdateAchievementInput = z.infer<typeof UpdateAchievementSchema>["body"];
