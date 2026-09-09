import { z } from 'zod';

export const getWordsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  cefrLevel: z.string().optional(),
  search: z.string().optional(), 
});

export const createWordSchema = z.object({
  headword: z.string().min(1, 'Không được để trống headword'),
  partOfSpeech: z.string().optional(),
  cefrLevel: z.string().optional(),
  phonetic: z.string().optional(),
  audioUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  meaning: z.string().min(1, 'Meaning không được để trống'),
  exampleSentence: z.string().optional(),
});

export const updateWordSchema = createWordSchema.partial();
export type CreateWordInput = z.infer<typeof createWordSchema>;
export type UpdateWordInput = z.infer<typeof updateWordSchema>;