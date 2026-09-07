import { z } from 'zod';

export const getWordsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  cefrLevel: z.string().optional(),
});