import { z } from "zod";

export const CreateTopicSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional().nullable(),
    cefrLevel: z.string().max(10).optional().nullable()
  }),
});

export const UpdateTopicSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/)
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional().nullable(),
    cefrLevel: z.string().max(10).optional().nullable()
  }),
});
